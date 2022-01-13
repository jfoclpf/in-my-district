<?php
	
	/**
	 * @package PrimaApp
	 */

?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>

</head>

<body <?php body_class(); ?>>
<?php do_action( 'wp_body_open' ); // phpcs:ignore WPThemeReview.CoreFunctionality.PrefixAllGlobals.NonPrefixedHooknameFound ?>
<div id="page" class="site">
    <a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'primaapp' ); ?></a>
    <header id="masthead" class="site-header">
        <div class="container">
            <div class="row">
                <div class="col-md-4 col-9">
                    <div class="site-branding">
                        <h1 class="site-title">
                            <a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
								<?php
									$primaapp_custom_logo_id = get_theme_mod( 'custom_logo' );
									$primaapp_logo_image     = wp_get_attachment_image_src( $primaapp_custom_logo_id, 'full' );
									$primaapp_site_name      = get_bloginfo( 'title' );
									if ( has_custom_logo() ) :
										?>
                                        <img src="<?php echo esc_url( $primaapp_logo_image[0] ); ?>"
                                             alt="<?php echo esc_attr( $primaapp_site_name ); ?>">

                                        <span><?php echo esc_html( $primaapp_site_name ); ?></span>
									
									<?php
									else :
										echo esc_html( $primaapp_site_name );
									endif;
								?>
                            </a>
                        </h1>
						<?php
							$primaapp_site_description = get_bloginfo( 'description', 'display' );
							if ( $primaapp_site_description && is_customize_preview() ) :
								?>
                                <p class="site-description"><?php echo $primaapp_site_description; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
									?></p>
							<?php endif; ?>
                    </div><!-- .site-branding -->
                </div>
                <div class="col-md-8 col-3 justify-content-end">
                    <nav id="site-navigation" class="main-navigation">
                        <button class="menu-toggle btn" aria-controls="primary-menu" aria-expanded="false">
                            <i class="fa fa-bars" aria-hidden="true"></i>
                        </button>
						<?php
							wp_nav_menu(
								array(
									'theme_location' => 'primary',
									'menu_id'        => 'primary-menu',
								)
							);
						?>
                    </nav><!-- #site-navigation -->
                </div>
            </div>
        </div>
    </header><!-- #masthead -->

    <div id="content" class="site-content">