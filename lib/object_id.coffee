if (typeof define != 'function') then define = (require('amdefine'))(module)
define () ->
  machineId = Math.ceil(Math.random()*10000000).toString().slice(0, 6)
  pid = Math.ceil(Math.random()*10000000).toString().slice(0, 4)
  increment = 0

  generateObjectId = () ->
    t = Math.floor((new Date).getTime() / 1000).toString(16)
    m = machineId
    p = pid
    i = increment.toString(16)

    if(increment > 0xffffff)
      increment = 0
    else
      increment++

    return '00000000'.substr(0, 8 - t.length) + t +
           '000000'.substr(0, 6 - m.length) + m +
           '0000'.substr(0, 4 - p.length) + p +
           '000000'.substr(0, 6 - i.length) + i
