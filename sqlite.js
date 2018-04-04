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

//Testa se é electron, e troca o stderr e stdout para console.
//Test if is Electon, and change sterr e stdout for console.
if (process.versions.electron) {
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
sqlite.prototype.sql = '';
sqlite.prototype.debug = false;

function sqlite() {

}

/**
 * Database connection
 *
 * @param {String|Object} db - File directory+filename | buffer
 * @return {Object}
 */
sqlite.prototype.connect = function (db) {
	if (typeof (db) == 'string') {
		this.file = db;
		if (!db || db === ':memory:' || db.indexOf('file::memory:') === 0) {
			this.buffer = new Buffer(0);
		} else if (fs.existsSync(this.file)) {
			this.buffer = fs.readFileSync(this.file);
		}
	} else if (typeof (db) == "object") {
		this.buffer = db;
	}

	if (this.buffer) {
		try {
			this.db = new SQL.Database(this.buffer);
		} catch (x) {
			throw x;
		}
	} else {
		try {
			this.db = new SQL.Database();
			this.write();
		} catch (x) {
			throw x;
		}
	}

	return this;
}

/**
 * Alternative connection
 */
sqlite.prototype.con = sqlite.prototype.connect;

/**
 * Runing queries | Sync & Async
 *
 * @param {String} sql - SQL code
 * @param {Array|Function} options - Array to prepared sql | callback function
 * @param {Function} callback - callback function
 * @return {Array|Object}
 */
sqlite.prototype.run = function (sql, options, callback) {
	if (typeof (options) == "function") {
		callback = options;
		options = [];
	}
	var results;
	var type = sql.substring(0, 6);
	type = type.toUpperCase();
	switch (type) {
		case "SELECT":
			results = this.pvSELECT(sql, options);
			break;
		case "INSERT":
			results = this.pvINSERT(sql, options);
			break;
		case "UPDATE":
			results = this.pvUPDATE(sql, options);
			break;
		case "DELETE":
			results = this.pvDELETE(sql, options);
			break;
		case "PRAGMA":
			results = this.pvPRAGMA(sql, options);
			break;
		default:
			results = this.runAll(sql)
	}
	if (callback) {
		callback(results);
		return this;
	} else {
		return results;
	}
};

/**
   * Runing queries Async
   *
   * @param {String} sql - SQL code
   * @param {Array|Function} options - Array to prepared sql | callback function
   * @param {Function} callback - callback function
   * @return {Array|Object} 

   * @deprecated This function will no longer be used soon!
   */
sqlite.prototype.runAsync = function (sql, options, callback) {
	this.sql = sql;
	if (typeof (options) == "function") {
		options(this.run(sql));
	} else if (typeof (callback) == "function") {
		callback(this.run(sql, options));
	} else {
		this.run(sql, options);
	}
	return this;
}

/**
 * PRAGMA statements
 *
 * @param {String} sql - SQL statement
 * @param {Array} where - Array ti prepared sql
 * @return {Object}
 */
sqlite.prototype.pvPRAGMA = function (sql, where) {
	if ((sql.split('=')).length > 1) {
		// update
		return this.pvUPDATE(sql, where);
	} else {
		// get
		return this.pvSELECT(sql, where);
	}
};

/**
 * Runing selects - PRIVATE
 *
 * @param {String}  sql - SQL code
 * @param {Array} where - Array to prepared sql 
 * @return {Object}
 */
sqlite.prototype.pvSELECT = function (sql, where) {
	if (where) {
		for (var i = 0; i < where.length; i++) {
			sql = sql.replace('?', ":arg" + i);
		}
	}
	this.sql = sql;
	try {
		var stmt = this.db.prepare(sql);
		stmt.bind(where);
		var resultado = [];
		while (stmt.step()) {
			resultado.push(stmt.getAsObject());
		}
		stmt.free();
		return resultado;
	} catch (x) {
		if (this.debug) {
			throw x;
		}
		return {
			error: x
		}
	}
}

/**
 * Runing deletes - PRIVATE
 *
 * @param {String}  sql - SQL code
 * @param {Array} where - Array to prepared sql 
 * @return {Boo}
 */
sqlite.prototype.pvDELETE = function (sql, where) {
	if (where) {
		for (var i = 0; i < where.length; i++) {
			sql = sql.replace('?', ":arg" + i);
		}
	}
	this.sql = sql;
	try {
		var stmt = this.db.prepare(sql);
		stmt.bind(where);
		stmt.step();
		stmt.free();
		this.write();
		return this.db.getRowsModified();
	} catch (x) {
		if (this.debug) {
			throw x;
		}
		return {
			error: x
		};
	}
}

/**
 * Runing insets - PRIVATE
 *
 * @param {String}  sql - SQL code
 * @param {Array} data - Array to prepared sql 
 * @return {Int} last insert id
 */
sqlite.prototype.pvINSERT = function (sql, data) {
	if (data) {
		for (var i = 0; i < data.length; i++) {
			sql = sql.replace('?', ":arg" + i);
		}
	}
	this.sql = sql;
	try {
		var stmt = this.db.prepare(sql);
		stmt.bind(data);
		stmt.step();
		stmt.free();
		var last = this.pvSELECT("SELECT last_insert_rowid()");
		this.write();
		return last[0]['last_insert_rowid()'];
	} catch (x) {
		if (this.debug) {
			throw x;
		}
		return {
			error: x
		};
	}

}

/**
 * Runing updates - PRIVATE
 *
 * @param {String}  sql - SQL code
 * @param {Array} data - Array to prepared sql 
 * @return {Boo} 
 */
sqlite.prototype.pvUPDATE = function (sql, data) {
	if (data) {
		for (var i = 0; i < data.length; i++) {
			sql = sql.replace('?', ":arg" + i);
		}
	}
	this.sql = sql;
	try {
		var stmt = this.db.prepare(sql);
		stmt.bind(data);
		stmt.step();
		stmt.free();
		this.write();
		return this.db.getRowsModified();
	} catch (x) {
		if (this.debug) {
			throw x;
		}
		return {
			error: x
		};
	}
}

/**
 * Runing INSERT - Publics
 *
 * @param {String}  entity - Name of database table
 * @param {Object} data - Object to be inserted
 * @param {Function} callback - callback function
 * @return {Int|Object} - insert id | instance
 */
sqlite.prototype.insert = function (entity, data, callback) {
	var keys = [];
	var values = []
	var binds = [];
	for (key in data) {
		if (!data.hasOwnProperty(key)) continue;
		keys.push(key);
		values.push(data[key]);
		binds.push('?');
	}

	var sql = "INSERT INTO " + entity + " (" + keys.join(',') + ") VALUES (" + binds.join(",") + ")";
	this.sql = sql;
	if (callback) {
		callback(this.run(sql, values));
		return this;
	} else {
		return this.run(sql, values);
	}
}

/**
 * Runing UPDATE - Publics
 *
 * @param {String}  entity - Name of database table
 * @param {Object} data - Object to be updated
 * @param {Object|Function} clause - Object with wheres | callback function
 * @param {Function} callback - callback function
 * @return {Boo|Object} - result | instance
 */
sqlite.prototype.update = function (entity, data, clause, callback) {
	var sets = [];
	var where = [];
	if (typeof (clause) == "function") {
		callback = clause;
		clause = {};
	}
	var values = [];
	for (key in data) {
		if (!data.hasOwnProperty(key)) continue;
		sets.push(key + " = ?");
		values.push(data[key]);
	}
	for (key in clause) {
		if (!clause.hasOwnProperty(key)) continue;
		where.push(key + " = ?");
		values.push(clause[key]);
	}

	var sql = "UPDATE " + entity + " SET " + sets.join(', ') + (where.length > 0 ? " WHERE " + where.join(" AND ") : "");

	this.sql = sql;

	if (callback) {
		callback(this.run(sql, values));
		return this;
	} else {
		return this.run(sql, values);
	}
}

/**
 * Runing DELETE - Publics
 *
 * @param {String}  entity - Name of database table
 * @param {Object|Function} clause - Object with wheres | callback function
 * @param {Function} callback - callback function
 * @return {Boo|Object} - result | instance
 */
sqlite.prototype.delete = function (entity, clause, callback) {
	var where = [];
	if (typeof (clause) == "function") {
		callback = clause;
		clause = [];
	}

	var values = [];
	if (clause) {
		for (key in clause) {
			if (!clause.hasOwnProperty(key)) continue;
			where.push(key + " = ?");
			values.push(clause[key]);
		}
	}

	var sql = "DELETE FROM " + entity + " WHERE " + where.join(" AND ");

	this.sql = sql;

	var result = this.pvDELETE(sql, values);

	if (callback) {
		callback(result);
		return this;
	} else {
		return result;
	}
}

/**
 * Runing All - PRIVATE
 *
 * @param {String}  sql - SQL
 * @return {Boo} 
 */
sqlite.prototype.runAll = function (sql) {
	this.sql = sql;
	try {
		var tes = this.db.exec(sql)
		this.write();
		return tes;
	} catch (x) {
		if (this.debug) {
			throw x;
		}
		return {
			error: x
		};
	}
}

/**
 * Writing file or calling buffer callback
 *
 * @return {Object} 
 */
sqlite.prototype.write = function () {
	var data = this.db.export();
	var buffer = new Buffer(data);

	if (this.file) {
		fs.writeFileSync(this.file, buffer);
	} else if (this.writer && typeof (this.writer) == 'function') {
		this.writer(buffer);
	}
	return this;
}

/*
 * Creating functions
 *
 * @param {Function} func - the function
 * @return {Object} 
 */
sqlite.prototype.create_function = function (func) {
	this.db.create_function(func.name, func);
}

/**
 * Closing connection
 */
sqlite.prototype.close = function () {
	this.db.close();
}

/**
 * Get current sql
 * @return {String}
 */
sqlite.prototype.getSql = function () {
	return this.sql;
}

// Exporting module
module.exports = new sqlite();