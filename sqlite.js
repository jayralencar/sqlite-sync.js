/*
The MIT License (MIT)

Copyright (c) 2015 Jayr Alencar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

function sqlite () {}
//Testa se é electron, e troca o stderr e stdout para console.
//Test if is Electon, and change sterr e stdout for console.
if(process.versions.electron){
	process.stderr.write = console.error.bind(console); 
	process.stdout.write = console.log.bind(console); 
}
//Requeries
var fs = require('fs');
var SQL = require('sql.js');
var path = require('path');
var events = require('events');

//Variables
sqlite.prototype.db = null;
sqlite.prototype.buffer = null;
sqlite.prototype.writer = null;
sqlite.prototype.file = null;

/**
   * Database connection
   *
   * @param {String|Object} db - File directory+filename | buffer
   * @return {Object}
 */
sqlite.prototype.connect = function(db){
	if(typeof(db)=='string'){
		this.file = db;
		if(fs.existsSync(this.file)){
			this.buffer = fs.readFileSync(this.file);
		}
	}else if(typeof(db)=="object"){
		this.buffer = db;
	}

	if(this.buffer){
		try{
			this.db = new SQL.Database(this.buffer);	
		}catch(x){
			throw x;
		}
	}else{
		try{
			this.db = new SQL.Database();	
		}catch(x){
			throw x;
		}
	}

	return this;	
}


sqlite.prototype.run = function(sql, options, callback) {
	if(typeof(options) == "function"){
		callback = options;
		options = [];
	}
	var results;
	var type = sql.substring(0,6);
	type = type.toUpperCase();
	switch(type){
		case "SELECT": results = this.pvSELECT(sql, options); break;
		case "INSERT": results = this.pvINSERT(sql, options); break;
		case "UPDATE": results = this.pvUPDATE(sql, options); break;
		case "DELETE": results = this.pvDELETE(sql, options); break;
		default: results = this.runAll(sql)
	}
	if(callback){
		callback(results);
		return this;
	}else{
		return results;
	}
};

//Async -- Depreciado
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
	try{
		var contents = this.db.exec(sql);	
	}catch(x){
		throw x
	}
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

// DELETE
sqlite.prototype.pvDELETE = function(sql, where){
	if(where){
		for(var i = 0 ; i < where.length; i++){
			sql = sql.replace('?',where[i]);
		}
	}
	try{
		this.db.exec(sql);	
		this.write();
		return true;
	}catch(x){
		throw x;
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

sqlite.prototype.delete = function(entity, clause, callback){
	var where = [];
	if(typeof(clause)=="function"){
		callback = clause;
		clause = [];
	}
	
	if(clause){
		for(key in clause){
			where.push(key+" = '"+clause[key]+"'");
		}
	}

	var sql = "DELETE FROM "+entity+" WHERE "+where.join(" AND ");

	var result = this.pvDELETE(sql);

	if(callback){
		callback(result);
		return this;
	}else{
		return result;
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

	if(this.file){
		fs.writeFileSync(this.file, buffer);
	}else if(this.writer && typeof(this.writer) == 'function' ){
		this.writer(buffer);
	}
	return this;
}



module.exports = new sqlite();