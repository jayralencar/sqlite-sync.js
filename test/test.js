var sqlite = require('../sqlite');

sqlite.connect('test/test.db');
// sqlite.debug = true;

var res = sqlite.run("CREATE TABLE COMPANYS(ID  INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT NOT NULL);");

sqlite.insert("COMPANYS",{NAME:"TESTE"}, function(res){

});

sqlite.run("BEGIN; DELETE FROM COMPANYS WHERE ID = 6; ROLLBACK;");

sqlite.run('SELECT * FROM COMPANYS', function(res){
	if(res.error)
		throw (res.error)
	console.log(res)
});

sqlite.close();