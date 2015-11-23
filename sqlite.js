var fs = require('fs');
var SQL = require('sql.js');

function sqlite () {
	// body...
}

sqlite.prototype.db = null;
sqlite.prototype.buffer = null;
sqlite.prototype.file = '';

sqlite.prototype.connect = function(db){
	this.file = db;
	if(fs.existsSync(db)){
		var filebuffer = fs.readFileSync(db);
		buffer = filebuffer;
		try{
			var connection = new SQL.Database(filebuffer);	
			this.db = connection;
		}catch(x){
			throw x;
		}
	}else{
		throw "Database not found";
	}
	return this;	
}

sqlite.prototype.run = function(sql, options, options2) {
	//SELECT
	//INSERT
	//UPDATE
	//DELETE
	var type = sql.substring(0,6);
	type = type.toUpperCase();
	switch(type){
		case "SELECT": return this.pvSELECT(sql, options); break;
		case "INSERT": return this.pvINSERT(sql, options); break;
		case "UPDATE": return this.pvUPDATE(sql, options); break;
		case "DELETE": return this.runAll(sql); break;
		default: return this.runAll(sql)
	}
};

//Async
sqlite.prototype.runAsync = function(sql, options, callback){
	if(typeof(options) == "function"){
		options(this.run(sql));
	}else{
		callback(this.run(sql, options));
	}
	return this;
}

//Select
sqlite.prototype.pvSELECT = function(sql, where){
	if(where){
		for(var i = 0 ; i < where.length; i++){
			sql = sql.replace('?',where[i]);
		}
	}
	
	var contents = this.db.exec(sql);
	if(contents.length){
		var columns = contents[0].columns;
		var values = contents[0].values;
		var resultado = [];
		for(var i = 0 ; i < values.length ; i++){
			var linha = {};
			for(var j = 0 ; j < columns.length; j++){
				linha[columns[j]] = values[i][j]
			}
			resultado.push(linha);
		}
		return resultado;
	}else{
		return [];
	}
	
}

//INSERT
sqlite.prototype.pvINSERT = function(sql,data){
	if(data){
		for(var i = 0 ; i < data.length; i++){
			sql = sql.replace('?',"'"+data[i]+"'");
		}
	}
	this.db.run(sql);
	var last = this.pvSELECT("SELECT last_insert_rowid()");
	this.write();
	return last[0]['last_insert_rowid()'];
	
}

//UPDATE
sqlite.prototype.pvUPDATE = function(sql, data){
	if(data){
		for(var i = 0 ; i < data.length; i++){
			sql = sql.replace('?',"'"+data[i]+"'");
		}
	}
	try{
		this.db.run(sql)
		this.write();
		return true;
	}catch (x){
		return false;
		throw x
	}
}

//INSERT public
sqlite.prototype.insert = function(entity, data, callback){
	var keys = [];
	var values = []
	for(key in data){
		keys.push(key);
		values.push(data[key]);
	}

	var sql = "INSERT INTO "+entity+" ("+keys.join(',')+") VALUES ('"+values.join("','")+"')";
	if(callback){
		callback(this.run(sql));
		return this;
	}else{
		return this.run(sql);
	}
}

//UPDATE public
sqlite.prototype.update = function(entity, data, clause, callback){
	var sets = [];
	var where = [];
	for(key in data){
		sets.push(key+" = '"+data[key]+"'");
	}
	for(key in clause){
		where.push(key+" = '"+clause[key]+"'");
	}

	var sql = "UPDATE "+entity+" SET "+sets.join(', ')+" WHERE "+where.join(" AND ");

	if(callback){
		callback(this.run(sql));
		return this;
	}else{
		return this.run(sql);
	}
}

//Comum
sqlite.prototype.runAll = function(sql){
	try{
		this.db.run(sql)
		this.write();
		return true;
	}catch (x){
		return false;
		throw x
	}
}

sqlite.prototype.write = function(){
	var data = this.db.export();
	var buffer = new Buffer(data);
	fs.writeFileSync(this.file, buffer);
	return this;
}



module.exports = new sqlite();