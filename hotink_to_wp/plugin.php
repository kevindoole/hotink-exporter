<?php
/*
Plugin Name: Hotink to WP
Author: Kevin Doole
Author URI: http://kevindoole.com/
Version: 0.1
License: none!
*/

function HITWP_make_tax_labels($name, $plural = true) {
	$names = ($plural === true) ? $name.'s' : $name;
	return array(
		'name' => _x($name, 'post type general name'),
		'singular_name' => _x($name, 'post type singular name'),
		'search_items' => _x('Search', strtolower($name)),
		'all_items' => __('All '.$name),
		'parent_item' => __('Parent '.$name),
		'parent_item_colon' => __( 'Parent :' . $name ),
		'edit_item' => __( 'Edit '.$name ), 
		'update_item' => __( 'Update '.$name ),
		'add_new_item' => __( 'Add New '.$name ),
		'new_item_name' => __( 'New ' . $name . ' Name' ),
		'menu_name' => __( $name ),
		);
}

function HITWP_create_taxonomies () {
    register_taxonomy('contributor',array('post'), array(
        'hierarchical' => false,
        'labels' => HITWP_make_tax_labels('Contributors'),
        'show_ui' => true,
        'query_var' => true,
        'rewrite' => array( 'slug' => 'contributor' ),
        ));
    register_taxonomy('section',array('post'), array(
    	'hierarchical' => false,
    	'labels' => HITWP_make_tax_labels('Sections'),
    	'show_ui' => true,
    	'query_var' => true,
    	'rewrite' => array( 'slug' => 'section' ),
    	));
    
}
add_action( 'init', 'HITWP_create_taxonomies', 0 );

function HITWP_change_post_menu_label() {
	global $menu;
	global $submenu;
	$menu[5][0] = 'Articles';
	$submenu['edit.php'][5][0] = 'Articles';
	$submenu['edit.php'][10][0] = 'Add Article';
	$submenu['edit.php'][16][0] = 'Article Tags';
	echo '';
}
function HITWP_change_post_object_label() {
	global $wp_post_types;
	$labels = &$wp_post_types['post']->labels;
	$labels->name = 'Articles';
	$labels->singular_name = 'Article';
	$labels->add_new = 'Add Article';
	$labels->add_new_item = 'Add Article';
	$labels->edit_item = 'Edit Article';
	$labels->new_item = 'Article';
	$labels->view_item = 'View Article';
	$labels->search_items = 'Search Articles';
	$labels->not_found = 'No Articles found';
	$labels->not_found_in_trash = 'No Articles found in Trash';
}
add_action( 'init', 'HITWP_change_post_object_label' );
add_action( 'admin_menu', 'HITWP_change_post_menu_label' );