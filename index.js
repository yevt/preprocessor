var through = require('through');

module.exports = function(context) {
  var platform = context.platform;
  var config = context;

  var preprocess = function(file, src, callback) {
    var preprocessIfThenElse = function() {
      re_if = /(?:^[^\n]*# {0,1}if ([^\n]+?)(?:-->)?$)([\s\S]+?)(?:(?:^[^\n]*# *else[^\n]*$)([\s\S]+?))?(?:^[^\n]*# *endif[^\n]*$)/gm;
      src = src.replace(re_if, function(match, condition, ifcode, elsecode) {
        if (elsecode == null) {
          elsecode = '';
        }
        try {
          if (eval(condition)) {
            return ifcode;
          } else {
            return elsecode;
          }
        } catch (ex) {
          var errorText = ['Preprocessing error (condition): ', ex.message, ' ', condition].join('');
          error(errorText);
          return match;
        }
      });
    };

    var preprocessEcho = function() {
      re_echo = /(?:@echo\{([^\n]*?)\})/gm;
      src = src.replace(re_echo, function(match, echo_code) {
        try {
          return eval(echo_code);
        } catch (ex) {
          var errorText = ['Preprocessing error (echo): ', ex.message, ' ', echo_code].join('');
          error(errorText);
          return match;
        }
      });
    };

    var preprocessPlusPlus = function() {
      var plusplus, plusplus_replace, re_echo, re_if;
      plusplus = /\+\+([a-zA-Z\._\[\]\'\"]+)/gm;
      plusplus_replace = '$1++ + 1';
      src = src.replace(plusplus, plusplus_replace);
    };

    var done = function() {
      callback(null, src);
    };

    var error = function(text) {
      callback(text);
    };

    if (config.replace_plusplus) {
      preprocessPlusPlus();
    }
    preprocessIfThenElse();
    preprocessEcho();
    done();
  };


  return function(file) {
    //if (!isCoffee(file)) return through();

    var data = '', stream = through(write, end);

    return stream;

    function write(buf) {
      data += buf;
    }

    function end() {
      preprocess(file, data, function(error, result) {
        if (error) stream.emit('error', error);
        stream.queue(result);
        stream.queue(null);
      });
    }
  };
};
