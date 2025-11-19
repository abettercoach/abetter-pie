const PADDING = 30;
const COLOR_PALETTE = [
  [0,0,0],
  [63,63,63],
  [127,127,127],
  [191,191,191],
  [255,255,255],
  // [60,90,230],
  // [120,80,220],
  // [100,180,120],
  // [220,100,20],
  // [240,180,170],
  // [240,200,70],
];

let ColorPicker = {
  new: function() {
    
    function draw() {
      let stroke_w = 3;
      let padding = 10;
      let r = 18;
      let x = - ((COLOR_PALETTE.length * r) + (padding * (COLOR_PALETTE.length - 1))) / 2 + r / 2;
      let y = height / 2 - PADDING;

      stroke(235);
      strokeWeight(stroke_w);

      for (const [i, color] of COLOR_PALETTE.entries()) {
        fill(color);
        circle(x + (r + padding)*i,y,r);
      }
    }

    let picker = {
      draw: draw,
    };
    return picker;
  }
};

let Button = {
  new: function(x, y, r) {
    let _showing = false;
    let _x = x;
    let _y = y;
    let _r = r;
    let _f;

    let button = {
      move: move,
      showing: () => _showing,
      hovering: hovering,
      clicking: clicking,
      show: () => {
        _showing = true;
      },
      hide: () => {
        _showing = false;
      },
      set_draw: (f) => {_f = f},
      draw: draw,
    };

    function move(x,y) {
      _x = x;
      _y = y;
    }

    function hovering() {
      let rel_x = mouseX - width * 0.5;
      let rel_y = mouseY - height * 0.5;
      let d = dist(rel_x,rel_y,_x,_y);
      return d <= _r;
    }

    function clicking() {
      return hovering() && _showing;
    }

    function draw() {
      if (!button.showing()) return;
      _f(_x,_y,_r);
    }

    return button;
  }
};

let RemoveButton = {
  new: function() {
    let button = Button.new(width / 2 - 30, height / 2 - 30, 10);

    let shade = 180;
    let hover_shade = 30;

    button.set_draw((x,y,r) => {
      stroke(button.hovering() ? hover_shade : shade);
      strokeWeight(3);

      line(x,y,x+r,y);
      line(x,y,x-r,y);
    });

    return button;
  }
};

let AddButton = {
  new: function() {
    let button = Button.new(width / 2 - 30, height / 2 - 30, 10);

    let shade = 180;
    let hover_shade = 30;

    button.set_draw((x,y,r) => {
      stroke(button.hovering() ? hover_shade : shade);
      strokeWeight(3);

      line(x,y,x+r,y);
      line(x,y,x,y+r);
      line(x,y,x-r,y);
      line(x,y,x,y-r);
    });

    button.show();
    return button;
  }
}

let ScaleHandle = {
  new: function(x,y,r) {
    //TODO: I want to be able to instantiate and move the Handle from the Slice, so 
    //we need to flesh out the Slice object and refactor Chart so delegate drawing to the
    //slices themselves. So on calc_sizes we'll re-position each slice. This will aso 
    //allow for future animation I think. Each slice should know how to draw itself independently
    //from the rest of the chart.

    let _slice;
    let button = Button.new(x,y,r);

    button.set_draw((x,y,r) => {

      let d_x, d_y;

      let a = slice.angle;
      if (a => 0) {
        d_x = (((r/2) + 15)) * cos(a);
        d_y = (((r/2) + 15)) * sin(a);
      }

      button._x = x+d_x;
      button._y = y+d_y;
      button._r = 30;

      strokeWeight(2);
      let c = color(slice.color[0], slice.color[1], slice.color[2], 255);
      stroke(c);

      let s = button.hovering() ? 5 : 3;

      push();

      translate(x+d_x, y+d_y);
      rotate(a);
      scale(s);

      point(0, -3);
      point(0,0);
      point(0, 3);

      point(3, -3);
      point(3, 0);
      point(3, 3);
    
      pop();
    });

    button.set_slice = (slice) => {
      _slice = slice;
    };

    button.show();

    button.hovering = () => {
      let rel_x = mouseX - width * 0.5;
      let rel_y = mouseY - height * 0.5;
      let d = dist(rel_x,rel_y, button._x, button._y);

      return d <= button._r;
    }

    return button;

  },
}

let Slice = {
  new: function(angle, size) {
    let color_i = floor(random() * (COLOR_PALETTE.length - 1));
    let _r;
    let _x = width * 0.5;
    let _y = height * 0.5;

    function hovering() {
      let d = dist(mouseX,mouseY,_x,_y);
      let a = atan2(mouseY - _y, mouseX - _x);
      if (a < 0){
        a += 2*PI;
      }

      if (slice.start > slice.stop) {
        return d <= _r/2 && (a > slice.start || a <= slice.stop);
      }

      return d <= _r/2 && a >= slice.start && a < slice.stop;
    }

    function startDrag() {
      slice.dragging = true;
      slice.dragStartX = mouseX;
      slice.dragStartY = mouseY;
      slice.dragStartSize = slice.size;
    }

    function stopDrag() {
      slice.dragging = false;
    }

    function drag() {
      let og_d = dist(slice.dragStartX,slice.dragStartY,_x,_y);
      let d = dist(mouseX,mouseY,_x,_y);

      slice.size = (d / og_d) * slice.dragStartSize;
    }

    function draw(x,y,r){
      let d_x = 0;
      let d_y = 0;

      if (slice.selected) {
        r *= 1.15;
        let a = slice.angle;
        d_x = 15 * cos(a);
        d_y = 15 * sin(a);

        let c = color(slice.color[0], slice.color[1], slice.color[2], 255);
        fill(c);
  
      } else {
        let c = color(slice.color[0], slice.color[1], slice.color[2], 255);
        fill(c);
        //console.log(slice.chart.selected_slice);
        r = slice.hovering() && !slice.chart.selected_slice ? r * 1.10 : r;
      }

      _r = r;

      strokeWeight(4);
      stroke(240);
      
      push();
      translate(d_x,d_y);

      arc(x, y, r, r, slice.start, slice.start + slice.size * 2 * PI, PIE);

      pop();

      if (slice.selected) {
        let handle = ScaleHandle.new(x+d_x,y+d_y,r);
        handle.set_slice(slice);
        handle.draw();
        slice.handle = handle;
      }
    }

    let slice = {
      uuid: crypto.randomUUID(),
      name: '',
      color: COLOR_PALETTE[color_i],
      size: size,
      angle: angle,
      hovering: hovering,
      selected: false,
      start: 0,
      stop: 0,
      draw: draw,
      startDrag: startDrag,
      stopDrag: stopDrag,
      drag:drag
    };
    

    return slice;
  }
}

let Chart = {
  new: function() {
    let _x = 0;
    let _y = 0;
    let _r = 0;

    let slices = [];
    let selected_slice;

    let hovering = false;

    let add_button = AddButton.new();
    let remove_button = RemoveButton.new();
    let color_picker = ColorPicker.new();

    function total_size() {
      return slices.reduce((accumulator, slice) => {
        return accumulator + slice.size;
      }, 0);
    }

    function average_size() {
      return total_size() / slices.length;
    }

    function normalize_sizes() {
      let sum = total_size();
      for (slice of slices) {
        slice.size = slice.size / sum;
      }
    }

    function calc_sizes() {
      normalize_sizes();
      console.log(slices);

      if (!selected_slice) {
        selected_slice = slices[0];
      }

      let slice = selected_slice;
      let og = slice;
      
      let arc_len = (2 * PI) * slice.size; 
      slice.start = (slice.angle - arc_len * 0.5)  % (2 * Math.PI);
      if (slice.start < 0) {
        slice.start += 2 * PI;
      }
      slice.stop = (slice.start + arc_len) % (2 * Math.PI);
      console.log(slices);

      let rest_arc = 2 * PI - arc_len;
      let stop = og.stop;
      let start = 0;

      while (slice.next.uuid !== og.uuid ) {
        slice = slice.next;

        let len = slice.size * 2 * PI;
        start = stop;
        stop = start + len;
        let new_a = (start + stop) * 0.5;

        console.log(`len ${len}, start ${start}, stop ${stop}, new_a ${new_a}`);

        slice.angle = new_a % (2 * Math.PI);
        slice.start = start % (2 * Math.PI);
        slice.stop = stop % (2 * Math.PI);
        console.log(`a ${slice.angle}, start ${slice.start}, stop ${slice.stop}`);
      }
    }

    function add_slice() {
        let total = total_size();
        let avg = total / slices.length;
        let norm = avg / (total + avg);

        let a = 0;
        let arc_len = PI * 2 * norm;
        let arc_start = - arc_len * 0.5 + (2 * PI);
        let arc_end = arc_len * 0.5;

        //Squeeze The Rest of the Pie
        let rest_arc = 2 * PI - arc_len;
        let rest_start = 0;
        let rest_stop = arc_end;

        for (s of slices) {
          let new_size = s.size * rest_arc;
          rest_start = rest_stop;
          rest_stop = rest_start + new_size;
          let new_a = (rest_start + rest_stop) * 0.5;

          s.angle = new_a;
          s.start = rest_start;
          s.stop = rest_stop;
          s.size = s.size / (total + avg);
        }

        let first = slices[0];
        let last = slices[slices.length - 1];

        let slice = Slice.new(a, norm);
        slice.angle = 0;
        slice.start = arc_start;
        slice.stop = arc_end;
        slice.size = norm;
        slice.chart = chart;

        last.next = slice;
        first.prev = slice;
        slice.next = first;
        slice.prev = last;

        slices.push(slice);
        console.log(slices);

        //calc_sizes();
        //normalize_sizes();
    }

    function remove_slice(uuid) {
          let remaining = slices.filter(s => {
            let match = s.uuid == uuid;
            if (match) {
              s.prev.next = s.next;
              s.next.prev = s.prev;
            }
            return !match;
          });

          selected_slice = null;
          slices = remaining;
          calc_sizes();
    }

    document.addEventListener('mousemove', function(event) {

      //distance from circle
      let d = dist(mouseX,mouseY,_x,_y);
      let was_hovering = hovering;
      hovering = d <= _r/2 ; //I'm not sure why I need to divide by 2 here....

      if (!was_hovering && hovering) {
        add_button.hide();
      }
      if (was_hovering && !hovering) {
        if (!selected_slice) add_button.show();
      }

      //angle in percentage
      let a = atan2(mouseY - _y, mouseX - _x);
      if (a < 0){
        a += 2*PI;
      }

      for (slice of slices) {
        if (slice.dragging) {
          slice.drag();
          calc_sizes();
        }
      }

    });

    document.addEventListener('click', function(event) {
      if (add_button.clicking()) {
        chart.add_slice();
      }

      if (remove_button.clicking()) {
        remove_button.hide();
        remove_slice(selected_slice.uuid);
      }

      if (!hovering) {
        add_button.show();
      }

      selected_slice = null;
      for (slice of slices) {
        slice.selected = slice.hovering() && slices.length > 1;
        if (slice.selected) {
          selected_slice = slice;
          chart.selected_slice = selected_slice;
          remove_button.show();
        }else {
          chart.selected_slice = null;
        }
      }
      return;
    });

    document.addEventListener('mousedown', function(event) {
      for (slice of slices) {
        if (slice.selected) {
          if (slice.handle) {
            if(slice.handle.hovering()) {
              slice.startDrag();
            }
          }
        }
      }
    });

    document.addEventListener('mouseup', function(event) {
      for (slice of slices) {
        if (slice.dragging) {
          slice.stopDrag();
        }
      }
    });

    function draw(x, y, r) {
        _x = x + width * 0.5;
        _y = y + height * 0.5;
        _r = r;

        ellipseMode(CENTER);

        for (slice of slices) {
          slice.draw(x, y, r);
        }

        if (selected_slice) {
          remove_button.show();
          add_button.hide();
        }

        remove_button.draw();
        add_button.draw();
        color_picker.draw();
    }

    let chart = {
      add_slice: add_slice,
      remove_slice: remove_slice,
      draw: draw
    };

    let initial_slice = Slice.new(0,1);
    initial_slice.chart = chart;
    initial_slice.start = 0;
    initial_slice.stop = 2 * PI;
    initial_slice.next = initial_slice;
    initial_slice.last = initial_slice;
    slices.push(initial_slice);

    return chart;
  }
}

let chart;

function setup() {
  createCanvas(windowWidth, windowHeight);

  chart = Chart.new();

}

function draw() {
  clear();
  background(220);       // Set the background color

  let chart_r = width * 0.4;

  push();
  translate(width * 0.5, height * 0.5);

  chart.draw(0, 0, chart_r);

  pop();
}
