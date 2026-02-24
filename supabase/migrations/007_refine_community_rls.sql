-- Allow authors to delete their own comments
CREATE POLICY "post_comments_delete_own" ON post_comments FOR DELETE
  USING (author_id = auth.uid());

-- Allow authors to update their own comments
CREATE POLICY "post_comments_update_own" ON post_comments FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
