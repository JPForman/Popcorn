import { useState, type FormEvent } from "react";
import { useAddComment, useComments, useDeleteComment } from "../../hooks/api/useComments";
import { useCurrentUser } from "../../hooks/api/useCurrentUser";
import styles from "./CommentThread.module.scss";

export function CommentThread({ ratingId }: { ratingId: string }) {
  const [body, setBody] = useState("");
  const { data: currentUser } = useCurrentUser();
  const { data: comments, isLoading } = useComments(ratingId);
  const addComment = useAddComment(ratingId);
  const deleteComment = useDeleteComment(ratingId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    addComment.mutate({ body }, { onSuccess: () => setBody("") });
  }

  return (
    <div className={styles.thread}>
      {isLoading && <p>Loading comments…</p>}
      <ul className={styles.list}>
        {comments?.map((comment) => (
          <li key={comment.id} className={styles.comment}>
            <span className={styles.author}>{comment.user.displayName}</span>
            <span>{comment.body}</span>
            {currentUser?.id === comment.userId && (
              <button
                type="button"
                aria-label={`Delete your comment: "${comment.body}"`}
                onClick={() => deleteComment.mutate(comment.id)}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
      {currentUser && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Add a comment…"
            aria-label="Add a comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
          />
          <button type="submit" disabled={addComment.isPending || !body.trim()}>
            Post
          </button>
        </form>
      )}
    </div>
  );
}
