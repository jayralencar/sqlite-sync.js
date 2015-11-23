# sqlite-sync.js
Node module to sqlite sync and async</br>
[![NPM](https://nodei.co/npm/sqlite-sync.png?downloads=true&downloadRank=true)](https://nodei.co/npm/sqlite-sync/)

Pacote node.js feito para conexão com banco de dados <strong>sqlite</strong>, e para executar os comandos sql de forma síncrona ou assíncrona, a gosto do desenvolvedor.

# Instalação
<code>npm install sqlite-sync</code>

# Uso
O uso do sqlite-sync é bem simples, ele foi desenvolvido para funcionar de forma síncrona ou assíncrona, e a conexão com o banco de dados é totalmente síncrona, por isso o nome. Veja como usar:
<pre>
<code>
var sqlite = require('sqlite-sync');

//Connecting
sqlite.connect('myDatabase.db');

//Create example table
sqlite.run("CREATE TABLE COMPANYS(ID  INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT NOT NULL);");

</code>
</pre>

<br/>
Veja mais no <a href="https://github.com/JayrAlencar/sqlite-sync.js/wiki">Wiki</a>
# Desenvolvedor
<a href="//jayralencar.com.br">Jayr Alencar</a>
