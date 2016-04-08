var sqlite = require('../sqlite');

sqlite.connect('test/test.db');

sqlite.run("CREATE TABLE COMPANYS(ID  INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT NOT NULL);");

sqlite.insert("COMPANYS",{NAME:"My COMPANY"}, function(inserid){
	console.log(inserid);
});

sqlite.update("COMPANYS",{NAME:"TESTING UPDATE"},{ID:1});
console.log(sqlite.getSql())

function test(a,b){
	return a+b;
}

sqlite.create_function(test);

console.log(sqlite.run("SELECT ID, test(NAME, ' Inc') as NAME FROM COMPANYS"));

sqlite.close();