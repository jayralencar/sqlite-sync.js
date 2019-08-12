# Change Log
This change log is started in 0.3.3;

## 0.3.5
-- Error Handling
-- Debug options

## 0.3.4 (2016-04-19)
- Execute PRAGMA statements (update/get)
```js
sqlite.run('PRAGMA table_info(COMPANYS)', function(res){
	console.log(res)
});
```

## 0.3.3 (2016-04-08)
- get current sql
```js
	console.log(sqlite.getSql());
```
## 0.3.9 (2019-08-12)

- use of fixed sql.js version 0.3.2 instead of latest to avoid compability errors