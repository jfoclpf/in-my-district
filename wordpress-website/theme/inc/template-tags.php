<?php
/**
 * Custom template tags for this theme
 *
 * Eventually, some of the functionality here could be replaced by core features.
 *
 * @package PrimaApp
 */

if ( ! function_exists( 'primaapp_posted_on' ) ) :
	/**
	 * Prints HTML with meta information for the current post-date/time.
	 */
	function primaapp_posted_on() {
		$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
		if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) {
			$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time>';
		}

		$time_string = sprintf( $time_string,
			esc_attr( get_the_modified_date( DATE_W3C ) ),
			esc_html( get_the_modified_date() )
		);

		$posted_on = sprintf(
			/* translators: %s: post date. */
			esc_html_x( ' %s', 'post date', 'primaapp' ), // phpcs:ignore WordPress.WP.I18n.NoEmptyStrings
			'<a href="' . esc_url( get_day_link(get_post_time('Y'), get_post_time('m'), get_post_time('j')) ) . '" rel="bookmark">' . $time_string . '</a>'
		);

		echo '<span class="posted-on">' . '<i class="fa fa-calendar" aria-hidden="true"></i>'.$posted_on . '</span>'; // WPCS: XSS OK.

	}
endif;

if ( ! function_exists( 'primaapp_posted_by' ) ) :
	/**
	 * Prints HTML with meta information for the current author.
	 */
	function primaapp_posted_by() {
		$byline = sprintf(
			/* translators: %s: post author. */
			esc_html_x( ' %s', 'post author', 'primaapp' ), // phpcs:ignore WordPress.WP.I18n.NoEmptyStrings
			'<span class="author vcard"><a class="url fn n" href="' . esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) . '">' . esc_html( get_the_author() ) . '</a></span>'
		);

		echo '<span class="byline"> ' . '<i class="fa fa-user" aria-hidden="true"></i>'.$byline . '</span>'; // WPCS: XSS OK.

	}
endif;

if ( ! function_exists( 'primaapp_entry_footer' ) ) :
	/**
	 * Prints HTML with meta information for the categories, tags and comments.
	 */
	function primaapp_entry_footer() {
		// Hide category and tag text for pages.
		if ( 'post' === get_post_type() ) {
			primaapp_posted_on();
			primaapp_posted_by();

			/* translators: used between list items, there is a space after the comma */
			$categories_list = get_the_category_list( ' | ');
			if ( $categories_list ) {
				/* translators: 1: list of categories. */
				printf( '<span class="cat-links">' . '<i class="fa fa-archive" aria-hidden="true"></i>'.esc_html__( ' %1$s', 'primaapp' ) . // phpcs:ignore WordPress.WP.I18n.NoEmptyStrings
                        '</span>', $categories_list ); // WPCS: XSS OK.
			}

			/* translators: used between list items, there is a space after the comma */
			$tags_list = get_the_tag_list( '', esc_html_x( ' - ', 'list item separator', 'primaapp' ) );
			if ( $tags_list ) {
				/* translators: 1: list of tags. */
				printf( '<span class="tags-links">' .'<i class="fa fa-tags" aria-hidden="true"></i>'. esc_html__( ' %1$s', 'primaapp' ) . // phpcs:ignore WordPress.WP.I18n.NoEmptyStrings
                        '</span>', $tags_list ); // WPCS: XSS OK.
			}
		}

		edit_post_link(
			sprintf(
				wp_kses(
					/* translators: %s: Name of current post. Only visible to screen readers */
					__( 'Edit <span class="screen-reader-text">%s</span>', 'primaapp' ),
					array(
						'span' => array(
							'class' => array(),
						),
					)
				),
				get_the_title()
			),
			'<span class="edit-link">',
			'</span>'
		);
	}
endif;

if ( ! function_exists( 'primaapp_post_thumbnail' ) ) :
	/**
	 * Displays an optional post thumbnail.
	 *
	 * Wraps the post thumbnail in an anchor element on index views, or a div
	 * element when on single views.
	 */
	function primaapp_post_thumbnail() {
		if ( post_password_required() || is_attachment() || ! has_post_thumbnail() ) {
			return;
		}

		if ( is_singular() ) :
			?>

			<div class="post-thumbnail">
				<?php the_post_thumbnail(); ?>
			</div><!-- .post-thumbnail -->

		<?php else : ?>

		<a class="post-thumbnail" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
			<?php
			the_post_thumbnail( 'post-thumbnail', array(
				'alt' => the_title_attribute( array(
					'echo' => false,
				) ),
			) );
			?>
		</a>

		<?php
		endif; // End is_singular().
	}
endif;
