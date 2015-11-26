var sqlite = require('../sqlite');

sqlite.connect('test.db');

sqlite.run("CREATE TABLE COMPANYS(ID  INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT NOT NULL);");

sqlite.insert("COMPANYS",{NAME:"My COMPANY"}, function(inserid){
	console.log(inserid);
});

console.log(sqlite.run("SELECT * FROM COMPANYS"));