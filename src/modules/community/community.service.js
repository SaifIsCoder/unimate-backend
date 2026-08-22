import { AppError } from "../../utils/app-error.js";
import { STUDENT, TEACHER, isAdmin } from "../../constants/roles.js";
import { withTransaction } from "../../utils/transaction.js";
import { pool } from "../../config/db.js";
import * as communityRepo from "./community.repository.js";
import * as studentRepo from "../student/student.repository.js";
import * as teacherRepo from "../teacher/teacher.repository.js";
import * as adminRepo from "../admins/admin.repository.js";
import { sanitizeHtml } from "../../utils/sanitizer.js";


const getUserDepartment = async (userId, role) => {
  if (role === STUDENT) {
    const student = await studentRepo.findByUserId(userId);
    return student?.department_id || null;
  }
  if (role === TEACHER) {
    const teacher = await teacherRepo.findByUserId(userId);
    return teacher?.department_id || null;
  }
  if (isAdmin(role)) {
    const admin = await adminRepo.findByUserId(userId);
    return admin?.department_id || null;
  }
  return null;
};

/**
 * Roles permitted to moderate other people's content.
 *
 * Teachers are included so they can police their own department's feed —
 * previously only admins could, which left teachers with no way to act on
 * anything in a community they are responsible for. Students never moderate;
 * they may only edit or remove their own posts and comments.
 */
const isModerator = (role) => isAdmin(role) || role === TEACHER;

/**
 * Throws unless `user` may moderate content belonging to `departmentId`.
 *
 * Fails closed when either side is null. `community_posts.department_id` is
 * nullable and so is a user's department, and the previous inline check
 * (`post.department_id !== department`) treated `null !== null` as a match —
 * so a moderator with no department could act on a department-less post. An
 * absent department is not a shared one.
 */
const assertModeratesDepartment = async (departmentId, user) => {
  const department = await getUserDepartment(user.id, user.role);

  const sameDepartment =
    department != null &&
    departmentId != null &&
    String(departmentId) === String(department);

  if (!sameDepartment) {
    throw new AppError("Forbidden: Cannot moderate outside your department", 403);
  }
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
    type: payload.type || "general",
    image_url: payload.image_url || null,
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
  const post = await communityRepo.getPostById(id, user.id);
  if (!post) throw new AppError("Post not found", 404);

  const department = await getUserDepartment(user.id, user.role);
  if (post.department_id !== department && !isAdmin(user.role)) {
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

  // Moderation: a teacher or admin changing a post's status inside their own
  // department. Only `status` is applied here — a moderator hides or removes
  // content, they do not rewrite someone else's words.
  if (payload.status && isModerator(user.role)) {
    await assertModeratesDepartment(post.department_id, user);
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

  // Authorship is checked first so someone can always remove their own post,
  // whatever their role. Previously a staff author whose department had since
  // changed hit the moderation branch and was refused their own content.
  if (String(post.author_id) === String(user.id)) {
    return communityRepo.updatePost(id, { status: "deleted" });
  }

  // Otherwise only a teacher or admin, and only within their own department.
  //
  // Soft delete: the row survives with status 'deleted', so nothing cascades
  // away and the data is recoverable in the database. It is NOT reversible
  // through the API though — getPostById filters out deleted rows, so every
  // subsequent request 404s. Prefer 'hidden' via PATCH when the intent is
  // temporary.
  if (isModerator(user.role)) {
    await assertModeratesDepartment(post.department_id, user);
    return communityRepo.updatePost(id, { status: "deleted" });
  }

  throw new AppError("Forbidden: You can only delete your own posts", 403);
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

    if (user.role === STUDENT) {
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

  // Moderation: a teacher or admin changing a comment's status inside their own
  // department. A moderator who can hide a post but not an abusive comment on
  // it only has half a tool, so comments follow the same rule.
  if (payload.status && isModerator(user.role)) {
    const post = await communityRepo.getPostById(comment.post_id);
    // A comment on a soft-deleted post: getPostById filters those out, so the
    // parent may be missing. Treat it as unmoderatable rather than crashing on
    // a null dereference, which is what the previous code did.
    if (!post) throw new AppError("Parent post not found", 404);

    await assertModeratesDepartment(post.department_id, user);
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

  // Authorship first, so anyone can always remove their own comment — including
  // staff whose department no longer matches the post's.
  if (String(comment.author_id) === String(user.id)) {
    return communityRepo.updateComment(id, { status: "deleted" });
  }

  if (isModerator(user.role)) {
    const post = await communityRepo.getPostById(comment.post_id);
    if (!post) throw new AppError("Parent post not found", 404);

    await assertModeratesDepartment(post.department_id, user);
    return communityRepo.updateComment(id, { status: "deleted" });
  }

  throw new AppError("Forbidden: You can only delete your own comments", 403);
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
