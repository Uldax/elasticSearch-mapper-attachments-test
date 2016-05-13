<?php
    require 'core/DAO.php';
    $DAO = new DAO();
    $findObject =  array(							
        'fields' => 'privilege_id,privilege_label',
        'table' => "privilege"
    );
    $roles = $DAO->find($findObject);
?>

<html>
    <head>
        <link rel="stylesheet" href="css/style.css">
        <title>Recherche de PDF</title>
    </head>
    <body>
        
        <div id="contentWrap">
            <div id="form">
                <form>
                    <div id="innerForm">                            
                        <input id="inputSearch" type="text" name="Enter your keywords" placeholder="Enter your keywords"></br>
                        <div id="bottomForm">
                            <select name="Users" id="userPrivilege" >
                                <?php foreach ($roles as $role ) {
                                     echo("<option value=$role->privilege_id>$role->privilege_label</option>");
                                } ?>
                            </select>
                            <button id="submitButton" type="button"><img src="images/search.png" width="60 px" height="60 px"></button> 
                        </div>
                    </div>
                </form>
            </div>      
        </div>           
    </body>
   <script type="text/javascript" src="js/script.js"></script>
</html>