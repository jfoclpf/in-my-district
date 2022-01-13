<?php

/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package PrimaApp
 */

?>

</div><!-- #content -->


<?php
$primaapp_footer_address_text = trim(get_theme_mod('pt_theme_footer_address_text'));
$primaapp_footer_email_address = trim(get_theme_mod('pt_theme_footer_email'));
$primaapp_footer_website = trim(get_theme_mod('pt_theme_footer_website'));
$primaapp_footer_website_text = trim(get_theme_mod('pt_theme_footer_website_text'));
$primaapp_footer_signature = get_theme_mod('pt_theme_footer_site_signature', __('Powered by WordPress
', 'primaapp'));
?>
<footer id="colophon" class="site-footer">
	<div class="container">
		<div class="main-footer-container">
			<div class="row justify-content-between">
				<div class="col-md-6">
					<?php
					$primaapp_footer_logo = get_theme_mod('pt_theme_footer_logo_image');
					$primaapp_footer_logo_text = get_theme_mod('pt_theme_footer_logo_text', get_bloginfo('name'));
					?>
					<?php if (primaapp_check_whitespaces($primaapp_footer_logo)) : ?>
						<h3 class="logo-container">
							<img src="<?php echo esc_url($primaapp_footer_logo); ?>" alt="<?php echo esc_attr($primaapp_footer_logo_text); ?>">
						</h3>
					<?php else : ?>
						<h3 class="logo-text"><?php echo esc_html($primaapp_footer_logo_text); ?>
						</h3>
					<?php endif; ?>
					
				</div>
				<div class="col-md-6">
					<div class="footer-details-container">
						<?php echo wp_kses_post($primaapp_footer_address_text); ?>
                        <?php
                            if(is_email($primaapp_footer_email_address)){
                        ?>
						<p>
							<a href="<?php esc_url('mailto:' . sanitize_email($primaapp_footer_email_address)); ?>"><?php echo sanitize_email($primaapp_footer_email_address); ?></a>
						</p>
                        <?php
                            }
	                        if (filter_var($primaapp_footer_website, FILTER_VALIDATE_URL) !== FALSE) {
                        ?>
						<p>
							<a href="<?php echo esc_url($primaapp_footer_website); ?>"><?php echo esc_html($primaapp_footer_website_text); ?></a>
						</p>
                        <?php
                            }
                        ?>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="site-info">
		<div class="container">
			<div class="row">
				<div class="col-md-12 text-center">
					<?php echo wp_kses_post($primaapp_footer_signature); ?>
				</div>
			</div>
		</div>
	</div><!-- .site-info -->
</footer><!-- #colophon -->
</div><!-- #page -->

<?php wp_footer(); ?>
<button id="backToTop" title="<?php echo esc_attr__('Go to top', 'primaapp'); ?>"><i class="fa fa-caret-up"></i>
</button>

</body>

</html>