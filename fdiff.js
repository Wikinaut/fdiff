/**
 * FDIFF
 *
 * Copyright 2012 Frank de Jong
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Version 0.3 (FdJ - 06/11/2012 15:29)
 */

// Module header required to export functions
var fdiff = (function () {
var my = {};

// Globals within the module

var START_ADD = "<u>";
var END_ADD = "</u>";

var START_REM = "<strike>";
var END_REM = "</strike>";


// Bug fix -- if there is an opening bracket without a closing bracket,
// we ignore the opening bracket (change it into a square one)

my.fix_unclosed_brackets = function( v1 ) 
{
  var chars = v1.split("");
  var char, loop;
  var bracket_text = "";
  var clean = "", word = "";

  for( loop = 0; loop < chars.length; loop++ )
  {
    char = chars[ loop ];

    if (bracket_text !== "" ) {
      bracket_text = bracket_text + char;
      if( char === ')' ) {
        clean = clean + bracket_text;
        bracket_text = "";
      }
    } 
    else 
    {
      if( char === '(' ) {
        // Scan ahead to closing bracket and form atom
        bracket_text = char;
        if( word !== "" ) { 
          clean = clean + word; 
          word = ""; 
        }
      } else {
        // All other cases: add to word
        word = word + char;
      }
    }
  }

  // Only change anything if there was a remaining open bracket
  if( bracket_text !== "" ) {
    return clean + "[" + bracket_text.substr( 1 );
  } 

  return v1;
};



// LCSubStr2
//
// Returns the indices of the largest common substring
// in the two given word arrays, while looking only at
// those words that appear in the indices arrays.
//
// The words to be ignored are compared anyway
// in the block that is deemed to be "the same" when
// ignoring some of the indices

my.LCSubStr2 = function( words1, words2, indices1, indices2 ) 
{
   var i, j, ii, ij;
   var ret = new Array( -1, -1, -1, -1 );
   var L = [];
   var z = 0;

   // Rows indicate index in first given string
   // Cols indicate index in second given string

   for( ii = 0; ii < indices1.length; ii++ ) 
   {
      i = indices1[ ii ];
      L[ ii ] = [];

      for( ij = 0; ij < indices2.length; ij++ ) 
      {
         j = indices2[ ij ];

         if( words1[i] === words2[j] ) 
         {
            // One longer than previous
            if( (ii === 0) || (ij === 0) ) {
               L[ ii ][ ij ] = 1;
            } else {
               L[ ii ][ ij ] = L[ ii - 1 ][ ij - 1 ] + 1;
            }

            // Current longer than longest?
            if( L[ ii ][ ij ] > z ) {
               z = L[ ii ][ ij ];
               ret[ 0 ] = indices1[ ii - z + 1 ];
               ret[ 1 ] = indices1[ ii ];
               ret[ 2 ] = indices2[ ij - z + 1 ];
               ret[ 3 ] = indices2[ ij ];
            }
         } else {
            L[ ii ][ ij ] = 0;
         }
      }
   }

   return ret;
};


// recurse
//
// Recursively recalculates the largest string of objects
// in the given two arrays, but skipping all those objects
// that are not in the index array.
//
// When returning the list of HTML elements describing
// the changes and non-changes, the part that looked
// the same when ignoring the skipped objects is compared
// again separately.

my.recurse = function( B, C, B_ind, C_ind )
{
  var B1, C1, B2, C2, AB, AC;
  var B1_ind = [];
  var B2_ind = [];
  var C1_ind = [];
  var C2_ind = [];
  var AB_ind = [];
  var AC_ind = [];
  var rv;
  var B_start, B_end, C_start, C_end;
  var before, after, removed, added;
  var val, loop;

  // Check for trivial solutions: only B or only C or neither is given
  if( B.length <= 0 ) {
    if( C.length >= 1 ) {
      return START_ADD + C.join("") + END_ADD;
    } else {
      return "";
    }
  } else {
    if( C.length <= 0 ) {
      return START_REM + B.join("") + END_REM;
    }
  }

  // No trivial solutions - find longest substring
  rv = my.LCSubStr2( B, C, B_ind, C_ind );
  B_start = rv[0]; B_end = rv[1]; C_start = rv[2]; C_end = rv[3];

  // Give up if no more common substrings (return value will be -1, -1, -1, -1)
  if( B_start < 0 ) {

     // Hard code any additions and removals. Check for any leading and trailing filtered 
     // stuff. This is done to prevent spaces from being removed and added again 
     before = [];
     while( (B.length > 0 ) && (C.length > 0) && (B[0] === C[0]) ) {
        before.push( B.shift() ); 
        C.shift(); 
     }

     after = [];
     while( (B.length > 0) && (C.length > 0) && (B[B.length - 1] === C[C.length - 1]) ) { 
        after.unshift( B.pop() );
        C.pop();
     }	

     if( B.length > 0 ) { 
        removed = [ START_REM ]; removed = removed.concat( B ); removed.push( END_REM );
     } else {
        removed = [];
     }

     if( C.length > 0 ) { 
        added = [ START_ADD ]; added = added.concat( C ); added.push( END_ADD );
     } else {
        added = [];
     }

     return before.join("") + removed.join("") + added.join("") + after.join("");
  }

  // Give up if only a common substring
  if( (B_start === 0 ) && (B_end === B.length - 1) &&
      (C_start === 0 ) && (C_end === C.length - 1) ) {

    return B.join("");
  }

  // Break up - splice really cuts the source array leaving the rest!
  // Left bit
  B1     = B.splice( 0, B_start );
  C1     = C.splice( 0, C_start );

  // Middle bit
  AB     = B.splice( 0, B_end - B_start + 1 );
  AC     = C.splice( 0, C_end - C_start + 1 );

  // Right bit - last bits
  B2     = B;
  C2     = C;

  // Rebuild indices
  for( loop = 0; loop < B_ind.length; loop++ ) { 
     val = B_ind[ loop ];
     if( val > B_end )   {  B2_ind.push( val - B_end - 1 ); }
     if( val < B_start ) {  B1_ind.push( val ); }
  }
  for( loop = 0; loop < C_ind.length; loop++ ) { 
     val = C_ind[ loop ];
     if( val > C_end )   {  C2_ind.push( val - C_end - 1 ); }
     if( val < C_start ) {  C1_ind.push( val ); }
  }
  for ( val = 0; val < AB.length; val++ ) { AB_ind.push( val ); }
  for ( val = 0; val < AC.length; val++ ) { AC_ind.push( val ); }

  // Recursively return the solution as the solution of the three sub parts.
  // Do the comparison of the "common" part A for all the words in the array.
  // Left and right as usual with indices.

  return ( my.recurse( B1, C1, B1_ind, C1_ind ) + 
           my.recurse( AB, AC, AB_ind, AC_ind ) +
           my.recurse( B2, C2, B2_ind, C2_ind ) );
};



// find_keywords_indices
// 
// Finds the indices of the "important" atoms, i.e those
// atoms not being punctuation marks or reference signs.

my.find_keyword_indices = function( words )
{
  var indices = [];
  var loop;
  var word;
  var regpat = /[\s,\,,\.,\;,\:,\?,\!,\(.*\)]/;

  for( loop = 0; loop < words.length; loop++ )
  {
    word = words[ loop ];

    if( word === "" ) {
      continue;
    }
    if( regpat.test( word ) ) {
      continue;
    }

    indices.push( loop );
  }

  return indices;
};


// split_punctuation
// 
// Converts the string into a number of atoms
// Strings between brackets are always one atom
// Punctuation marks are also an atom, also when
// they are inside floating point numbers

my.split_punctuation = function( v1 ) 
{
  var chars;
  var atoms = [];
  var bracket_text = "";
  var char, word, loop;
  var regpat = /[\s,\,,\.,\;,\:,\?,\!,\",\']/;

  // Do a check to make sure we don't have any unclosed brackets
  v1 = my.fix_unclosed_brackets( v1 );

  //
  // Do the actual splitting of punctuation
  //

  chars = v1.split( "" );
  bracket_text = "";
  word = "";

  for( loop = 0; loop < chars.length; loop++ )
  { 
    char = chars[ loop ];

    if( bracket_text !== "" ) {

      bracket_text = bracket_text + char;
      if( char === ')' ) {
        atoms.push( bracket_text );
        bracket_text = "";
      }

    } else {

      if( char === '(' ) {

        // Scan ahead to closing bracket and form atom
        bracket_text = char;
        if( word !== "" ) { 
           atoms.push( word ); 
           word = ""; 
        }

      } else {

        // Punctuation or space - form two new atoms
        if( regpat.test( char ) ) {

          if( word !== "" ) { 
            atoms.push( word ); 
          }
          atoms.push( char );
          word = "";

        } else {

          // All other cases: add to word
          word = word + char;

        }         
      }
    }
  }

  if( word !== "" ) { 
     atoms.push( word ); 
  }

  return atoms;
};



// execute
//
// Main function, call with two strings

my.execute = function( v1, v2 ) 
{
  var words1, words2;
  var indices1, indices2;

  // Replace whitespace (newlines, double spaces etc) by single space
  v1 = v1.split( /\s+/ ); v1 = v1.join( " " );
  v2 = v2.split( /\s+/ ); v2 = v2.join( " " );

  // Replace '—' with '-' (hyphen versus minus)
  v1 = v1.split( "—" ); v1 = v1.join( "-" );
  v2 = v2.split( "—" ); v2 = v2.join( "-" );

  // Make sure that punctuation marks are seen as separate words
  words1 = fdiff.split_punctuation( v1 );
  words2 = fdiff.split_punctuation( v2 );

  // Find the index table that skips all the entities in which we are 
  // not interested
  indices1 = fdiff.find_keyword_indices( words1 );
  indices2 = fdiff.find_keyword_indices( words2 );

  // Call the recursive part
  return fdiff.recurse( words1, words2, indices1, indices2 );
};


my.reformat_claims = function( input )
{
  // Add a newline before each claim (and probably claim number)
  input = input.split( /\.\s+/ );
  input = input.join( ".<BR>" );

  // Add a newline and indent for each new feature
  input = input.split( ";" );
  input = input.join( ";<BR>&nbsp;&nbsp;&nbsp;" );

  return input;
};



// These statements makes our function public (as fdiff.*)
return my;
}());
