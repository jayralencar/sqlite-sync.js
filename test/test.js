var sqlite = require('../sqlite');

sqlite.connect('test/test.db');
// sqlite.debug = true;

// var res = sqlite.run("CREATE TABLE COMPANYS(ID  INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT NOT NULL);");

sqlite.begin();

sqlite.insert("COMPANYS",{NAME:"TESTE"}, function(res){
	sqlite.commit();
	sqlite.run("SELECT COUNT(*) qt FROM COMPANYS", function(re){
		console.log(re[0].qt)
	})
});

sqlite.close();