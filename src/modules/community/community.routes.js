import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./community.controller.js";
import * as validation from "./community.validation.js";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(["student", "teacher", "admin"]));

// Posts
router.post(
  "/posts",
  validate({ body: validation.createPostSchema }),
  asyncHandler(controller.createPost)
);

router.get(
  "/posts",
  validate({ query: validation.getPostsQuery }),
  asyncHandler(controller.getPosts)
);

router.get(
  "/posts/:id",
  validate({ params: validation.idParams, query: validation.getPostsQuery }),
  asyncHandler(controller.getPostById)
);

router.patch(
  "/posts/:id",
  validate({ params: validation.idParams, body: validation.updatePostSchema }),
  asyncHandler(controller.updatePost)
);

router.delete(
  "/posts/:id",
  validate({ params: validation.idParams }),
  asyncHandler(controller.deletePost)
);

// Comments
router.post(
  "/posts/:id/comments",
  validate({ params: validation.idParams, body: validation.createCommentSchema }),
  asyncHandler(controller.createComment)
);

router.patch(
  "/comments/:id",
  validate({ params: validation.idParams, body: validation.updateCommentSchema }),
  asyncHandler(controller.updateComment)
);

router.delete(
  "/comments/:id",
  validate({ params: validation.idParams }),
  asyncHandler(controller.deleteComment)
);

// Likes
router.post(
  "/posts/:id/like",
  validate({ params: validation.idParams }),
  asyncHandler(controller.likePost)
);

router.delete(
  "/posts/:id/like",
  validate({ params: validation.idParams }),
  asyncHandler(controller.unlikePost)
);

export default router;
