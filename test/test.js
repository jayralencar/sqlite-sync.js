var sqlite = require('../sqlite');

sqlite.connect('test/test.db');

sqlite.run("CREATE TABLE COMPANYS(ID  INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT NOT NULL);");

sqlite.insert("COMPANYS",{NAME:"My COMPANY"}, function(inserid){
	console.log(inserid);
});

sqlite.update("COMPANYS",{NAME:"TESTING UPDATE"},{ID:1})

console.log(sqlite.run("SELECT * FROM COMPANYS"));

