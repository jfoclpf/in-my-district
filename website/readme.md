This is the Wordpress directory for the website of this project located at https://nomeubairro.app/

## `static/` directory

The directory `static/` is the export of the wordpress website as static files done with the plugin [Simply Static](https://wordpress.org/plugins/simply-static/).
To update these files one must

 - regenerate the static files at the [Simply Static plugin page](https://nomeubairro.app/wp-admin/admin.php?page=simply-static),
 - download the zip file to this directory and 
 - run `./update_static.sh`.

## `snippets/` directory

The directory `snippets/` has PHP snippets that are embedded in the website with the plugin [Insert PHP Code Snippet](https://wordpress.org/plugins/insert-php-code-snippet/).
