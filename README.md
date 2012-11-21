fdiff
=====

fdiff.js (FDiff) - a word-oriented text difference tool with re- and post-formatting

Example
```
var d = fdiff.execute( text1, text2 );

// if you want the post-formatting

if ( $('#semantic').attr("checked") ) {
	d = fdiff.reformat_claims( d );
}
$('#output').html( d );
```