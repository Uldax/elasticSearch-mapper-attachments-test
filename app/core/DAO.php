<?php

//Constante pour la base de donnée
define('HOST','localhost');
define('BASE', 'documentBase');
define('LOGIN', 'superopus');
define('PASSWORD', 'superopus');
//Constante d'environement
define('DEBUG', 1);


class DAO{	
	//On stock la connexion pour ne pas la refaire si c'est deja le cas
	private $pdo;
	private $errors=array();

	public function __construct(){
		try {
			$options[PDO::ATTR_ERRMODE] = PDO::ERRMODE_EXCEPTION;
			$options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES utf8";	
			$this->pdo= new PDO('pgsql:host='.HOST.';dbname='.BASE,LOGIN,PASSWORD,$options); 		
		} 		
		catch (PDOException $e){
			//Permet de cacher les erreur au visiteur
			if(DEBUG > 0)
				die($e->getMessage());
			else
				die("Erreur critique : impossible de se connecter à la base, vérifier le mpd/login");
		}		
	}

	/*
	Querry builder
	Les requete sont de la form find(array(							
									'fields' => 'id,name,ect...',
									'table' => name,
									'conditions' => array('id' =>'2'),
									'in' => (1,2)
									'order' => name ASC	
									));
	*/

	//Constructeur de requète si false + execution sinon
	public function find($req,$execute=true){
		//Etape 1 construction de la requete 		
		$sql= 'SELECT ';
		//On recupere les champ a séléctionner 
		if(isset($req['fields']) && !empty($req['fields'])){
			if(is_array($req['fields']))
				$sql.= implode(',',$req['fields']);		
			else
				$sql.= $req['fields'];
		}
		else
			$sql.='*';
		//Si une table specifique a été selectioné
		if(isset($req['table']) && !empty($req['table']) ){
			 	$sql .=' FROM ' .$req['table'].' as '.$req['table'] ;
		}
		//Sinon erreur
		else
			throw new Exception("Table non précisé");					
		
		//Construction de la condition si elle existe
		if(isset($req['conditions'])){
			$sql.=' WHERE ';
			if(!is_array($req['conditions']))
				$sql.=$req['conditions'];
			else{
				$cond = array();
				foreach ($req['conditions'] as $key => $value) {
					//protege la variable value ou la transforme si chaine
					if(!is_numeric($value))
						$value=$this->pdo->quote($value);
					$cond[]="$key=$value";
				}
				//implode rassemble les element d'un tableau en une chaine
				$sql.=implode(' AND ', $cond);				
			}			
		}
		//Constructin IN
		if(isset($req['in'])){
			if(is_array($req['in']))
				$sql.= 'IN ('.implode(',',$req['in']).')';		
			else
				$sql.= 'IN '.$req['in'];
		}	
		if(isset($req['order']))
			$sql.=" ORDER BY ".$req['order'];

		//Etape 2 : execution de la requete
		if($execute) 
			return $this->fetchAll($sql);
		if($execute===false)
			return $sql;
	}

	//Fonction qui prépare et execute une requète sql
	private function fetchAll($sql){
		try {
			$pre = $this->pdo->prepare($sql);
			$pre->execute();	
			return $pre->fetchAll(PDO::FETCH_OBJ);
		} 
		catch (Exception $e) {
			if(DEBUG > 0)
				throw new Exception($e->getMessage());	
			if(DEBUG > 1)
				die($sql);	
			//Si une requète est incorect on arrète l'execution
			die();		
		}
	}
 
 	//Get all column of table
	public function getColumn($table){
		$sql="SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='$table'";
		$pre = $this->pdo->prepare($sql);
		$pre->execute();
		return $pre->fetchAll(PDO::FETCH_OBJ);
	}
}
