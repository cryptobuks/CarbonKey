// So we can get deployed on Heroku
// http://blog.teamtreehouse.com/deploy-static-site-heroku
<?php 
header( "Location: https://" . $_SERVER["HTTP_HOST"] . '/index.html') ;  
?>