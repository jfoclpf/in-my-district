<?php

/**
 * PrimaApp functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package PrimaApp
 */

if (!function_exists('primaapp_setup')) :
    function primaapp_setup()
    {
        load_theme_textdomain('primaapp', get_template_directory() . '/languages');
        add_theme_support('title-tag');
        add_theme_support('post-thumbnails');
        add_theme_support('automatic-feed-links');
        add_theme_support('title-tag');
        register_nav_menus(
            array(
                'primary' => esc_html__('Primary Menu', 'primaapp'),
                'footer_social' => esc_html__('Footer Social Menu', 'primaapp')
            )
        );
        register_nav_menu('primary', __('Primary Menu', 'primaapp'));


        add_theme_support('html5', array(
            'search-form',
            'comment-form',
            'comment-list',
            'gallery',
            'caption',
        ));
        add_theme_support('custom-background', apply_filters('primaapp_custom_background_args', array(
            'default-color' => 'ffffff',
            'default-image' => '',
        )));
        add_theme_support('customize-selective-refresh-widgets');
        add_theme_support('custom-logo', array(
            'height' => 250,
            'width' => 250,
            'flex-width' => true,
            'flex-height' => true,
        ));
    }
endif;
add_action('after_setup_theme', 'primaapp_setup');

function primaapp_content_width()
{
    $GLOBALS['content_width'] = // phpcs:ignore WPThemeReview.CoreFunctionality.PrefixAllGlobals.NonPrefixedVariableFound
        apply_filters('content_width', 640); // phpcs:ignore WPThemeReview.CoreFunctionality.PrefixAllGlobals.NonPrefixedHooknameFound
}

add_action('after_setup_theme', 'primaapp_content_width', 0);

/**
 * Enqueue scripts and styles.
 */
function primaapp_scripts()
{
    wp_enqueue_style('bootstrap', get_template_directory_uri() . '/assets/css/bootstrap.min.css', '', '4.3.1');
    wp_enqueue_style('fontawesome', get_template_directory_uri() . '/assets/css/font-awesome.min.css');
    wp_enqueue_style('primaapp-fonts', 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;800;900&display=swap');
    wp_enqueue_style('primaapp-style', get_stylesheet_uri(), 'bootstrap', '1.0');

    wp_enqueue_script('bootstrap-js', get_template_directory_uri() . '/assets/js/bootstrap.min.js', array('jquery'), '4.3.1', true);
    wp_enqueue_script('navigation', get_template_directory_uri() . '/assets/js/navigation.js', array(), '1.0', true);
    wp_enqueue_script('primaapp', get_template_directory_uri() . '/assets/js/primaapp.js', array('jquery'), '1.0', true);

    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('comment-reply');
    }
}

add_action('wp_enqueue_scripts', 'primaapp_scripts');

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';

/**
 * Load Jetpack compatibility file.
 */
if (defined('JETPACK__VERSION')) {
    require get_template_directory() . '/inc/jetpack.php';
}
/**
 * Load customizer framework
 */
require get_template_directory() . '/inc/customizer.php';
/**
 * Load recommended plugins
 */
if (is_admin()) {
    require get_template_directory() . '/plugins/class-tgm-plugin-activation.php';
    require get_template_directory() . '/plugins/tgm-plugin-activation.php';
}

function primaapp_check_whitespaces($str)
{
    if (isset($str) && trim($str) != '') {
        return true;
    } else {
        return false;
    }
}


function primaapp_hex2rgba($color, $opacity = false)
{
    $default = 'rgb(0,0,0)';

    //Return default if no color provided
    if (empty($color)) {
        return $default;
    }

    //Sanitize $color if "#" is provided
    if ($color[0] == '#') {
        $color = substr($color, 1);
    }

    //Check if color has 6 or 3 characters and get values
    if (strlen($color) == 6) {
        $hex = array($color[0] . $color[1], $color[2] . $color[3], $color[4] . $color[5]);
    } elseif (strlen($color) == 3) {
        $hex = array($color[0] . $color[0], $color[1] . $color[1], $color[2] . $color[2]);
    } else {
        return $default;
    }

    //Convert hexadec to rgb
    $rgb = array_map('hexdec', $hex);

    //Check if opacity is set(rgba or rgb)
    if ($opacity) {
        if (abs($opacity) > 1) {
            $opacity = 1.0;
        }
        $output = 'rgba(' . implode(",", $rgb) . ',' . $opacity . ')';
    } else {
        $output = 'rgb(' . implode(",", $rgb) . ')';
    }

    //Return rgb(a) color string
    return $output;
}

function primaapp_special_styles()
{
?>

    <style>
        <?php
        $primaapp_main_color = get_theme_mod('pt_theme_main_color', '#673AB7');
        $primaapp_navbar_home_color = get_theme_mod('pt_theme_home_navbar_links');
        $primaapp_footer_background = get_theme_mod('pt_theme_footer_background_color', '#252525');
        $primaapp_footer_signature_background = get_theme_mod('pt_theme_footer_signature_background_color', '#000000');
        $primaapp_footer_text_color = get_theme_mod('pt_theme_footer_text_color', '#ffffff');
        ?>
        
        .site-header .main-navigation a,
        .site-header.scrolled .main-navigation a ,
        .site-header .menu-toggle.btn {
            color: <?php echo esc_attr($primaapp_navbar_home_color); ?>
        }

        #content.site-content .elementor-button-link {
            background-color: <?php echo esc_attr($primaapp_main_color); ?>;
        }

        #content.site-content article .entry-header a:hover,
        #content.site-content article .entry-footer a:hover {
            color: <?php echo esc_attr($primaapp_main_color); ?>
        }

        .navbar-nav .nav-item a:not(.dropdown-toggle):hover:after,
        .navbar-nav .nav-item a:not(.dropdown-toggle):focus:after {
            background-color: <?php echo esc_attr($primaapp_main_color); ?>;
        }

        #spec-section .icon span {
            border-bottom: 5px solid <?php echo esc_attr($primaapp_main_color); ?>;
        }

        .video .video-box a .icon:before {
            background-color: <?php echo esc_attr(primaapp_hex2rgba($primaapp_main_color, 0.7)); ?>
        }

        .video .video-box a .icon i {
            background-color: <?php echo esc_attr(primaapp_hex2rgba($primaapp_main_color, 1)); ?>
        }

        #contact-section h2:after {
            background-color: <?php echo esc_attr($primaapp_main_color); ?>;
        }


        .wpcf7-submit {
            background-color: <?php echo esc_attr($primaapp_main_color); ?>;
        }

        body.error404 .site-content {
            background-color: <?php echo esc_attr($primaapp_main_color); ?>;
        }

        footer.site-footer {
            background-color: <?php echo esc_attr($primaapp_footer_background); ?>;
        }

        .comment-form .submit {
            background-color: <?php echo esc_attr($primaapp_main_color); ?>;
        }
        footer.site-footer,
        footer.site-footer a{
            color: <?php echo esc_attr($primaapp_footer_text_color); ?>;
        }



        footer.site-footer .site-info {
            background-color: <?php echo esc_attr($primaapp_footer_signature_background); ?>;
        }

        #backToTop {
            background-color: <?php echo esc_attr($primaapp_main_color); ?>;
        }
    </style>
<?php
}

add_action('wp_head', 'primaapp_special_styles');

function primaapp_theme_add_nav_menu_meta_boxes()
{
    add_meta_box('pt_theme_special_nav_link', __('PrimaApp Special Links', 'primaapp'), 'primaapp_theme_nav_menu_links', 'nav-menus', 'side', 'low');
}

function primaapp_theme_nav_menu_links()
{
    $primaapp_links = array(
        get_home_url() . '#spec-section' => __('Features', 'primaapp'),
        get_home_url() . '#steps-section' => __('Steps', 'primaapp'),
        get_home_url() . '#video-section' => __('Video', 'primaapp'),
        get_home_url() . '#download-section' => __('Download', 'primaapp'),
        get_home_url() . '#contact-section' => __('Contact us', 'primaapp')
    );
?>
    <div id="posttype-pt-special-links" class="posttypediv">
        <div id="tabs-panel-pt-special-links" class="tabs-panel tabs-panel-active">
            <ul id="pt-special-links-checklist" class="categorychecklist form-no-clear">
                <?php
                $primaapp_i = -1;
                foreach ($primaapp_links as $key => $value) :
                ?>
                    <li>
                        <label class="menu-item-title">
                            <input type="checkbox" class="menu-item-checkbox" name="menu-item[<?php echo esc_attr($primaapp_i); ?>][menu-item-object-id]" value="<?php echo esc_attr($primaapp_i); ?>" /> <?php echo esc_html($value); ?>
                        </label>
                        <input type="hidden" class="menu-item-type" name="menu-item[<?php echo esc_attr($primaapp_i); ?>][menu-item-type]" value="custom" />
                        <input type="hidden" class="menu-item-title" name="menu-item[<?php echo esc_attr($primaapp_i); ?>][menu-item-title]" value="<?php echo esc_html($value); ?>" />
                        <input type="hidden" class="menu-item-url" name="menu-item[<?php echo esc_attr($primaapp_i); ?>][menu-item-url]" value="<?php echo esc_url(($key)); ?>" />
                        <input type="hidden" class="menu-item-classes" name="menu-item[<?php echo esc_attr($primaapp_i); ?>][menu-item-classes]" />
                    </li>
                <?php
                    $primaapp_i--;
                endforeach;
                ?>
            </ul>
        </div>
        <p class="button-controls">
            <span class="list-controls">
                <a href="<?php echo esc_url(admin_url('nav-menus.php?page-tab=all&selectall=1#posttype-pt-special-links')); ?>" class="select-all"><?php esc_html_e('Select all', 'primaapp'); ?></a>
            </span>
            <span class="add-to-menu">
                <button type="submit" class="button-secondary submit-add-to-menu right" value="<?php esc_attr_e('Add to menu', 'primaapp'); ?>" name="add-post-type-menu-item" id="submit-posttype-pt-special-links"><?php esc_html_e('Add to menu', 'primaapp'); ?></button>
                <span class="spinner"></span>
            </span>
        </p>
    </div>
<?php
}

add_action('admin_head-nav-menus.php', 'primaapp_theme_add_nav_menu_meta_boxes');
function primaapp_theme_update_menu_link($primaapp_items)
{
    if (is_front_page()) :
        foreach ($primaapp_items as $primaapp_item) {
            $url = parse_url($primaapp_item->url);
            if (isset($url["fragment"])) {
                $primaapp_item->url = get_home_url() . '/#' . $url["fragment"];
            } else {
                $primaapp_item->url = $primaapp_item->url;
            }
        }
        return $primaapp_items;
    else :
        foreach ($primaapp_items as $primaapp_item) {
            $url = parse_url($primaapp_item->url);
            if (isset($url["fragment"]))
                $primaapp_item->url = get_home_url() . '/#' . $url["fragment"]; //This variable contains the fragment
        }
        return $primaapp_items;
    endif;
}

add_filter('wp_nav_menu_objects', 'primaapp_theme_update_menu_link', 10, 2);