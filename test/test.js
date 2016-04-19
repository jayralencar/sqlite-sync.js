var sqlite = require('../sqlite');

sqlite.connect('test/test.db');

sqlite.run("CREATE TABLE COMPANYS(ID  INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT NOT NULL);");

sqlite.run('PRAGMA table_info(COMPANYS)', function(res){
	console.log(res)
});

sqlite.close();