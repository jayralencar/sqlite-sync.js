var sqlite = require('../sqlite');

sqlite.connect('test/test.db');

sqlite.run("CREATE TABLE COMPANYS(ID  INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT NOT NULL);");

sqlite.insert("COMPANYS",{NAME:"My COMPANY"}, function(inserid){
	console.log(inserid);
});

sqlite.delete('COMPANYS',{ID:4},function(res){
	console.log(res)
})

console.log(sqlite.run("SELECT * FROM COMPANYS"));

sqlite.run("SELECT * FROM COMPANYS WHERE ID = ?",[3], function(res){
	console.log(res)
})