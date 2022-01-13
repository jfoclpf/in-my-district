<?php
	
	/**
	 * primaapp Theme Customizer
	 *
	 * @package primaapp
	 */
	
	/**
	 * Add postMessage support for site title and description for the Theme Customizer.
	 *
	 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
	 */
	function primaapp_customize_register( $wp_customize ) {
		$wp_customize->get_setting( 'blogname' )->transport         = 'postMessage';
		$wp_customize->get_setting( 'blogdescription' )->transport  = 'postMessage';
		$wp_customize->get_setting( 'header_textcolor' )->transport = 'postMessage';
		
		if ( isset( $wp_customize->selective_refresh ) ) {
			$wp_customize->selective_refresh->add_partial( 'blogname', array(
				'selector'        => '.site-title a',
				'render_callback' => 'primaapp_customize_partial_blogname',
			) );
			$wp_customize->selective_refresh->add_partial( 'blogdescription', array(
				'selector'        => '.site-description',
				'render_callback' => 'primaapp_customize_partial_blogdescription',
			) );
		}
		$wp_customize->add_setting( 'pt_theme_home_navbar_links', array(
			'default'           => '#232529',
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_hex_color'
		) );
		$wp_customize->add_control( 'pt_theme_home_navbar_links_control', array(
			'label'       => __( 'Navbar links color', 'primaapp' ),
			'description' => __( 'Choose a custom color for navbar links in home page', 'primaapp' ),
			'section'     => 'colors',
			'settings'    => 'pt_theme_home_navbar_links',
			'type'        => 'color',
		) );
		$wp_customize->add_setting( 'pt_theme_main_color', array(
			'default'           => '#232529',
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_hex_color'
		) );
		$wp_customize->add_control( 'pt_theme_main_color_control', array(
			'label'       => __( 'Theme main color', 'primaapp' ),
			'description' => __( 'Select the main color of the theme', 'primaapp' ),
			'section'     => 'colors',
			'settings'    => 'pt_theme_main_color',
			'type'        => 'color',
		) );

// Create our panels
		
		$wp_customize->add_panel( 'pt_theme_footer_panel', array(
			'title' => __( 'Footer Options', 'primaapp' )
		) );

// Create our sections
		
		$wp_customize->add_section( 'pt_theme_footer_logo_section', array(
			'title' => __( 'Footer Logo Section', 'primaapp' )
		) );

// Create our settings
		
		$wp_customize->add_setting( 'pt_theme_footer_background_color', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_hex_color'
		) );
		$wp_customize->add_control( 'pt_theme_footer_background_color_control', array(
			'label'    => __( 'Select footer background color', 'primaapp' ),
			'section'  => 'pt_theme_footer_logo_section',
			'settings' => 'pt_theme_footer_background_color',
			'type'     => 'color',
		) );
		
		$wp_customize->add_setting( 'pt_theme_footer_signature_background_color', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_hex_color'
		) );
		$wp_customize->add_control( 'pt_theme_footer_signature_background_color_control', array(
			'label'    => __( 'Select footer site signature background color', 'primaapp' ),
			'section'  => 'pt_theme_footer_logo_section',
			'settings' => 'pt_theme_footer_signature_background_color',
			'type'     => 'color',
		) );
		
		$wp_customize->add_setting( 'pt_theme_footer_text_color', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'default'           => '#232529',
			'sanitize_callback' => 'sanitize_hex_color'
		) );
		$wp_customize->add_control( 'pt_theme_footer_text_color_control', array(
			'label'    => __( 'Select footer text color', 'primaapp' ),
			'section'  => 'pt_theme_footer_logo_section',
			'settings' => 'pt_theme_footer_text_color',
			'type'     => 'color',
		) );
		
		$wp_customize->add_setting( 'pt_theme_footer_logo_image', array(
			'type'      => 'theme_mod',
			'transport' => 'refresh',
			'sanitize_callback' => 'primaapp_sanitize_image'
		) );
		$wp_customize->add_control(
			new WP_Customize_Image_Control(
				$wp_customize,
				'pt_theme_footer_logo_image',
				array(
					'label'    => __( 'Footer Logo Image', 'primaapp' ),
					'section'  => 'pt_theme_footer_logo_section',
					'settings' => 'pt_theme_footer_logo_image',
				)
			)
		);
		
		$wp_customize->add_setting( 'pt_theme_footer_logo_text', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_text_field'
		) );
		$wp_customize->add_control( 'pt_theme_footer_logo_text_control', array(
			'label'    => __( 'Footer Logo Text', 'primaapp' ),
			'section'  => 'pt_theme_footer_logo_section',
			'settings' => 'pt_theme_footer_logo_text',
			'type'     => 'text',
		) );
		
		// Create our sections
		
		$wp_customize->add_section( 'pt_theme_footer_text_section', array(
			'title' => __( 'Footer Text Section', 'primaapp' )
		) );

// Create our settings
		
		$wp_customize->add_setting( 'pt_theme_footer_background_color', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_hex_color'
		) );
		$wp_customize->add_control( 'pt_theme_footer_text_control', array(
			'label'    => __( 'Select footer background color', 'primaapp' ),
			'section'  => 'pt_theme_footer_text_section',
			'settings' => 'pt_theme_footer_text',
			'type'     => 'textarea',
		) );
		
		$wp_customize->add_setting( 'pt_theme_footer_address_text', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_text_field'
		) );
		$wp_customize->add_control( 'pt_theme_footer_address_control', array(
			'label'    => __( 'Footer Website Address', 'primaapp' ),
			'section'  => 'pt_theme_footer_logo_section',
			'settings' => 'pt_theme_footer_address_text',
			'type'     => 'text',
		) );
		
		$wp_customize->add_setting( 'pt_theme_footer_email', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_email'
		) );
		$wp_customize->add_control( 'pt_theme_footer_email_control', array(
			'label'    => __( 'Footer Email', 'primaapp' ),
			'section'  => 'pt_theme_footer_logo_section',
			'settings' => 'pt_theme_footer_email',
			'type'     => 'email',
		) );
		
		$wp_customize->add_setting( 'pt_theme_footer_website_text', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_text_field'
		) );
		$wp_customize->add_control( 'pt_theme_footer_website_text_control', array(
			'label'    => __( 'Footer Website Text', 'primaapp' ),
			'section'  => 'pt_theme_footer_logo_section',
			'settings' => 'pt_theme_footer_website_text',
			'type'     => 'text',
		) );
		
		$wp_customize->add_setting( 'pt_theme_footer_website', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'esc_url_raw'
		) );
		$wp_customize->add_control( 'pt_theme_footer_website_control', array(
			'label'    => __( 'Footer Website', 'primaapp' ),
			'section'  => 'pt_theme_footer_logo_section',
			'settings' => 'pt_theme_footer_website',
			'type'     => 'url',
		) );
		
		$wp_customize->add_setting( 'pt_theme_footer_site_signature', array(
			'type'              => 'theme_mod',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_text_field'
		) );
		$wp_customize->add_control( 'pt_theme_footer_site_signature_control', array(
			'label'    => __( 'Site Signature Text', 'primaapp' ),
			'section'  => 'pt_theme_footer_logo_section',
			'settings' => 'pt_theme_footer_site_signature',
			'type'     => 'url',
		) );
	}
	
	add_action( 'customize_register', 'primaapp_customize_register' );
	
	/**
	 * Render the site title for the selective refresh partial.
	 *
	 * @return void
	 */
	function primaapp_customize_partial_blogname() {
		bloginfo( 'name' );
	}
	
	/**
	 * Render the site tagline for the selective refresh partial.
	 *
	 * @return void
	 */
	function primaapp_customize_partial_blogdescription() {
		bloginfo( 'description' );
	}
	
	/**
	 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
	 */
	function primaapp_customize_preview_js() {
		wp_enqueue_script( 'primaapp-customizer', get_template_directory_uri() . '/assets/js/customizer.js', array( 'customize-preview' ), '20151215', true );
	}
	
	add_action( 'customize_preview_init', 'primaapp_customize_preview_js' );
	
	function primaapp_sanitize_image( $input, $setting ) {
		return esc_url_raw( primaapp_validate_image( $input, $setting->default ) );
	}
	
	function primaapp_validate_image( $input, $default = '' ) {
		$mimes = array(
			'jpg|jpeg|jpe' => 'image/jpeg',
			'gif'          => 'image/gif',
			'png'          => 'image/png',
			'bmp'          => 'image/bmp',
			'tif|tiff'     => 'image/tiff',
			'ico'          => 'image/x-icon'
		);
		$file = wp_check_filetype( $input, $mimes );
		return ( $file['ext'] ? $input : $default );
	}
	
	function primaapp_sanitize_select( $input, $setting ) {
		$input = sanitize_key( $input );
		$choices = $setting->manager->get_control( $setting->id )->choices;
		return ( array_key_exists( $input, $choices ) ? $input : $setting->default );
	}