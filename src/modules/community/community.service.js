import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import { pool } from "../../config/db.js";
import * as communityRepo from "./community.repository.js";
import * as studentRepo from "../student/student.repository.js";
import * as teacherRepo from "../teacher/teacher.repository.js";
import * as adminRepo from "../admins/admin.repository.js";
import { sanitizeHtml } from "../../utils/sanitizer.js";


const getUserDepartment = async (userId, role) => {
  if (role === "student") {
    const student = await studentRepo.findByUserId(userId);
    return student?.department_id || null;
  }
  if (role === "teacher") {
    const teacher = await teacherRepo.findByUserId(userId);
    return teacher?.department_id || null;
  }
  if (role === "admin") {
    const admin = await adminRepo.findByUserId(userId);
    return admin?.department_id || null;
  }
  return null;
};

export const createPost = async (payload, user) => {
  const department = await getUserDepartment(user.id, user.role);
  if (!department) {
    throw new AppError("Department not found for user. Cannot create post.", 403);
  }

  const post = await communityRepo.createPost({
    author_id: user.id,
    department_id: department,
    title: sanitizeHtml(payload.title),
    content: sanitizeHtml(payload.content),
  });


  return post;
};

import { getPagination } from "../../utils/pagination.js";

export const getPosts = async (query, user) => {
  const department = await getUserDepartment(user.id, user.role);
  if (!department) {
    throw new AppError("Department not found for user.", 403);
  }

  const { page, limit, offset } = getPagination(query);

  const result = await communityRepo.getPostsByDepartment(department, limit, offset);
  return result;
};

export const getPostById = async (id, user, options = {}) => {
  const post = await communityRepo.getPostById(id);
  if (!post) throw new AppError("Post not found", 404);

  const department = await getUserDepartment(user.id, user.role);
  if (post.department_id !== department && user.role !== "admin") {
    throw new AppError(
      "Forbidden: Post belongs to a different department",
      403,
    );
  }

  const comments = await communityRepo.getCommentsByPostId(id, options);
  
  return { ...post, comments };
};

export const updatePost = async (id, payload, user) => {
  const post = await communityRepo.getPostById(id);
  if (!post) throw new AppError("Post not found", 404);

  // Admin moderation (hide)
  if (user.role === "admin" && payload.status) {
    const department = await getUserDepartment(user.id, user.role);
    if (post.department_id !== department) {
      throw new AppError(
        "Forbidden: Cannot moderate outside your department",
        403,
      );
    }
    return communityRepo.updatePost(id, { status: payload.status });
  }

  // Author update
  if (String(post.author_id) !== String(user.id)) {
    throw new AppError("Forbidden: You can only edit your own posts", 403);
  }

  // Authors can't arbitrarily change status to hidden or active if banned, but they can delete.
  // We'll restrict author payload to title and content here.
  const updateData = {};
  if (payload.title) updateData.title = sanitizeHtml(payload.title);
  if (payload.content) updateData.content = sanitizeHtml(payload.content);


  if (Object.keys(updateData).length === 0) return post;

  return communityRepo.updatePost(id, updateData);
};

export const deletePost = async (id, user) => {
  const post = await communityRepo.getPostById(id);
  if (!post) throw new AppError("Post not found", 404);

  if (user.role === "admin") {
    const department = await getUserDepartment(user.id, user.role);
    if (post.department_id !== department) {
      throw new AppError(
        "Forbidden: Cannot moderate outside your department",
        403,
      );
    }
    // Admin moderation defaults to 'hidden' or 'deleted' based on preference, we use 'deleted' for endpoint /delete
    return communityRepo.updatePost(id, { status: "deleted" });
  }

  if (String(post.author_id) !== String(user.id)) {
    throw new AppError("Forbidden: You can only delete your own posts", 403);
  }

  return communityRepo.updatePost(id, { status: 'deleted' });
};

export const createComment = async (postId, payload, user) => {
  return withTransaction(async (client) => {
    // 1. Check if post exists and lock it for share to ensure stability
    const post = await communityRepo.getPostById(postId, client);
    if (!post) throw new AppError("Post not found", 404);

    const department = await getUserDepartment(user.id, user.role);
    if (post.department_id !== department) {
      throw new AppError(
        "Forbidden: Cannot comment on posts outside your department",
        403,
      );
    }

    if (user.role === "student") {
      // 2. Lock the student's profile to serialize their comment creation and prevent race condition on limit
      await client.query("SELECT id FROM students WHERE user_id = $1 FOR UPDATE", [
        user.id,
      ]);

      const commentCount = await communityRepo.countCommentsByStudentOnPost(
        postId,
        user.id,
        client,
      );
      if (commentCount >= 3) {
        throw new AppError(
          "Comment limit reached: Students can only post up to 3 comments per post.",
          403,
        );
      }
    }

    const comment = await communityRepo.createComment(
      {
        post_id: postId,
        author_id: user.id,
        content: sanitizeHtml(payload.content),
      },
      client,
    );

    return comment;
  });
};

export const updateComment = async (id, payload, user) => {
  const comment = await communityRepo.getCommentById(id);
  if (!comment) throw new AppError("Comment not found", 404);

  // For Admin Moderation
  if (user.role === 'admin' && payload.status) {
    const post = await communityRepo.getPostById(comment.post_id);
    const department = await getUserDepartment(user.id, user.role);
    if (post.department_id !== department) {
      throw new AppError(
        "Forbidden: Cannot moderate outside your department",
        403,
      );
    }
    return communityRepo.updateComment(id, { status: payload.status });
  }

  if (String(comment.author_id) !== String(user.id)) {
    throw new AppError("Forbidden: You can only edit your own comments", 403);
  }

  const updateData = {};
  if (payload.content) updateData.content = sanitizeHtml(payload.content);


  if (Object.keys(updateData).length === 0) return comment;

  return communityRepo.updateComment(id, updateData);
};

export const deleteComment = async (id, user) => {
  const comment = await communityRepo.getCommentById(id);
  if (!comment) throw new AppError("Comment not found", 404);

  if (user.role === 'admin') {
    const post = await communityRepo.getPostById(comment.post_id);
    const department = await getUserDepartment(user.id, user.role);
    if (post.department_id !== department) {
      throw new AppError("Forbidden: Cannot moderate outside your department", 403);
    }
    return communityRepo.updateComment(id, { status: 'deleted' });
  }

  if (String(comment.author_id) !== String(user.id)) {
    throw new AppError("Forbidden: You can only delete your own comments", 403);
  }

  return communityRepo.updateComment(id, { status: 'deleted' });
};

export const likePost = async (postId, user) => {
  const post = await communityRepo.getPostById(postId);
  if (!post) throw new AppError("Post not found", 404);

  const department = await getUserDepartment(user.id, user.role);
  if (post.department_id !== department) {
    throw new AppError(
      "Forbidden: Cannot like posts outside your department",
      403,
    );
  }

  const like = await communityRepo.addLike(postId, user.id);
  if (!like) {
    // It hit ON CONFLICT DO NOTHING, meaning it was already liked
    throw new AppError("You have already liked this post", 400);
  }

  return { message: "Post liked successfully" };
};

export const unlikePost = async (postId, user) => {
  const post = await communityRepo.getPostById(postId);
  if (!post) throw new AppError("Post not found", 404);

  const department = await getUserDepartment(user.id, user.role);
  if (post.department_id !== department) {
    throw new AppError(
      "Forbidden: Cannot unlike posts outside your department",
      403,
    );
  }

  await communityRepo.removeLike(postId, user.id);
  return { message: "Post unliked successfully" };
};
