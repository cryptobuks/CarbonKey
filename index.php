// So we can get deployed on Heroku
// http://blog.teamtreehouse.com/deploy-static-site-heroku
<?php 
if($_SERVER["HTTPS"] != "on")
{
    header("Location: https://" . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"]);
    exit();
}

header( 'Location: /index.html' ) ;  
?>