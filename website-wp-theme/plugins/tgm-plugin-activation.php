<?php
/**
 * Recommends plugins for use with the theme via the TGMA Script
 *
 * @package PrimaApp WordPress theme
 */


add_action( 'tgmpa_register', 'primaapp_register_required_plugins' );

/**
 * Register the required plugins for this theme.
 *
 * In this example, we register five plugins:
 * - one included with the TGMPA library
 * - two from an external source, one from an arbitrary source, one from a GitHub repository
 * - two from the .org repo, where one demonstrates the use of the `is_callable` argument
 *
 * The variables passed to the `tgmpa()` function should be:
 * - an array of plugin arrays;
 * - optionally a configuration array.
 * If you are not changing anything in the configuration array, you can remove the array and remove the
 * variable from the function call: `tgmpa( $plugins );`.
 * In that case, the TGMPA default settings will be used.
 *
 * This function is hooked into `tgmpa_register`, which is fired on the WP `init` action on priority 10.
 */
function primaapp_register_required_plugins() {
    /*
     * Array of plugin arrays. Required keys are name and slug.
     * If the source is NOT from the .org repo, then source is also required.
     */
    $plugins = array(
	    array(
		    'name'               => __( 'Elementor', 'primaapp' ),
		    'slug'               => 'elementor',
		    'required'           => false,
	    ),
        array(
            'name'               => __( 'Contact Form 7', 'primaapp' ),
            'slug'               => 'contact-form-7',
            'required'           => false,
        ),
        array(
            'name'               => __( 'WPT Demo Importer', 'primaapp' ),
            'slug'               => 'wpt-demo-importer', // The plugin slug (typically the folder name).
            'required'           => false,
        ),
    );

    /*
     * Array of configuration settings. Amend each line as needed.
     *
     * TGMPA will start providing localized text strings soon. If you already have translations of our standard
     * strings available, please help us make TGMPA even better by giving us access to these translations or by
     * sending in a pull-request with .po file(s) with the translations.
     *
     * Only uncomment the strings in the config array if you want to customize the strings.
     */
    $config = array(
        'id'           => 'primaapp',
        'default_path' => '',
        'menu'         => 'tgmpa-install-plugins', // Menu slug.
        'has_notices'  => true,                    // Show admin notices or not.
        'dismissable'  => true,                    // If false, a user cannot dismiss the nag message.
        'dismiss_msg'  => '',                      // If 'dismissable' is false, this message will be output at top of nag.
        'is_automatic' => false,                   // Automatically activate plugins after installation or not.
        'message'      => '',                      // Message to output right before the plugins table.


        'strings'      => array(
            'page_title'                      => __( 'Install Required Plugins', 'primaapp' ),
            'menu_title'                      => __( 'Install Plugins', 'primaapp' ),
            'installing'                      => __( 'Installing Plugin: %s', 'primaapp' ),
            'updating'                        => __( 'Updating Plugin: %s', 'primaapp' ),
            'oops'                            => __( 'Something went wrong with the plugin API.', 'primaapp' ),
            'notice_can_install_required'     => _n_noop(
                'This theme requires the following plugin: %1$s.',
                'This theme requires the following plugins: %1$s.',
                'primaapp'
            ),
            'notice_can_install_recommended'  => _n_noop(
                'This theme recommends the following plugin: %1$s.',
                'This theme recommends the following plugins: %1$s.',
                'primaapp'
            ),
            'notice_ask_to_update'            => _n_noop(
                'The following plugin needs to be updated to its latest version to ensure maximum compatibility with this theme: %1$s.',
                'The following plugins need to be updated to their latest version to ensure maximum compatibility with this theme: %1$s.',
                'primaapp'
            ),
            'notice_ask_to_update_maybe'      => _n_noop(
                'There is an update available for: %1$s.',
                'There are updates available for the following plugins: %1$s.',
                'primaapp'
            ),
            'notice_can_activate_required'    => _n_noop(
                'The following required plugin is currently inactive: %1$s.',
                'The following required plugins are currently inactive: %1$s.',
                'primaapp'
            ),
            'notice_can_activate_recommended' => _n_noop(
                'The following recommended plugin is currently inactive: %1$s.',
                'The following recommended plugins are currently inactive: %1$s.',
                'primaapp'
            ),
            'install_link'                    => _n_noop(
                'Begin installing plugin',
                'Begin installing plugins',
                'primaapp'
            ),
            'update_link' 					  => _n_noop(
                'Begin updating plugin',
                'Begin updating plugins',
                'primaapp'
            ),
            'activate_link'                   => _n_noop(
                'Begin activating plugin',
                'Begin activating plugins',
                'primaapp'
            ),
            'return'                          => __( 'Return to Required Plugins Installer', 'primaapp' ),
            'plugin_activated'                => __( 'Plugin activated successfully.', 'primaapp' ),
            'activated_successfully'          => __( 'The following plugin was activated successfully:', 'primaapp' ),
            'plugin_already_active'           => __( 'No action taken. Plugin %1$s was already active.', 'primaapp' ),
            'plugin_needs_higher_version'     => __( 'Plugin not activated. A higher version of %s is needed for this theme. Please update the plugin.', 'primaapp' ),
            'complete'                        => __( 'All plugins installed and activated successfully. %1$s', 'primaapp' ),
            'dismiss'                         => __( 'Dismiss this notice', 'primaapp' ),
            'notice_cannot_install_activate'  => __( 'There are one or more required or recommended plugins to install, update or activate.', 'primaapp' ),
            'contact_admin'                   => __( 'Please contact the administrator of this site for help.', 'primaapp' ),
            'nag_type'                        => '', // Determines admin notice type - can only be one of the typical WP notice classes, such as 'updated', 'update-nag', 'notice-warning', 'notice-info' or 'error'. Some of which may not work as expected in older WP versions.
        ),
    );
    tgmpa( $plugins, $config );
}
