## File Uploader
Application to upload and retrieve a file through HTTPs requests. The files are readed and stored into a Postgres database. 
Inside the folder DatabaseOperations, write your postgres database configurations in the file config.json. Now, run the follow query to create a table in the database:

    CREATE TABLE filename_to_oid
    (
	    oid INT UNIQUE, 
	    filename VARCHAR UNIQUE
    );
You can also change the table name inside the config_json, if you like to.
Now, run the server on terminal with:

    npm start
The server will open on port 3000. To upload a file to the database, send a POST request to the address: localhost:3000/file. Include your file as a Multipartform data with the name "file". To return your file, make a GET request to the address: localhost:3000/file/[your-filename-here]. 
   

