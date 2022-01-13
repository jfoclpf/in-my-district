<?php
/**
 * Template part for displaying posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package PrimaApp
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<header class="entry-header">
		<?php
		if (is_singular()) :
			the_title('<h1 class="entry-title">', '</h1>');
		else :
			the_title('<h2 class="entry-title"><a href="' . esc_url(get_permalink()) . '" rel="bookmark">', '</a></h2>');
		endif;

		?>
	</header><!-- .entry-header -->

	<?php primaapp_post_thumbnail(); ?>
	<div class="entry-content">
		<?php
		if (is_singular()) :
			the_content(sprintf(
				wp_kses(
					/* translators: %s: Name of current post. Only visible to screen readers */
					__('Continue reading<span class="screen-reader-text"> "%s"</span>', 'primaapp'),
					array(
						'span' => array(
							'class' => array(),
						),
					)
				),
				get_the_title()
			));
		else :
			the_excerpt(sprintf(
				wp_kses(
			/* translators: %s: Name of current post. Only visible to screen readers */
			__('Continue reading<span class="screen-reader-text"> "%s"</span>', 'primaapp'),
					array(
						'span' => array(
							'class' => array(),
						),
					)
				),
				get_the_title()
			));

		endif;

		wp_link_pages(array(
			'before' => '<div class="page-links">' . esc_html__('Pages:', 'primaapp'),
			'after' => '</div>',
		));
		?>
	</div><!-- .entry-content -->

	<footer class="entry-footer">
		<?php primaapp_entry_footer(); ?>
	</footer><!-- .entry-footer -->
</article><!-- #post-<?php the_ID(); ?> -->