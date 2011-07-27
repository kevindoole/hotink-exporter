DELETE FROM wordpress.wp_comments WHERE comment_ID >= 0;
DELETE FROM wordpress.wp_links WHERE link_id >= 0;
DELETE FROM wordpress.wp_postmeta WHERE post_id >= 0;
DELETE FROM wordpress.wp_posts WHERE id >= 0;
DELETE FROM wordpress.wp_term_relationships WHERE object_id >= 0;
