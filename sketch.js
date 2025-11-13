const PADDING = 30;
const COLOR_PALETTE = [
  [60,90,230],
  [120,80,220],
  [100,180,120],
  [220,100,20],
  [240,180,170],
  [240,200,70],
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
    let showing = false;
    let _x = x;
    let _y = y;
    let _r = r;
    let _f;

    let button = {
      move: move,
      showing: () => showing,
      hovering: hovering,
      clicking: clicking,
      show: () => {
        showing = true;
      },
      hide: () => {
        showing = false;
      },
      set_draw: (f) => {_f = f},
      draw: draw,
    };

    function move(x,y) {
      _x = x;
      _y = y;
    }

    function hovering() {
      let rel_x = _x + width * 0.5;
      let rel_y = _y + height * 0.5;
      let d = dist(mouseX,mouseY,rel_x,rel_y);
      return d <= _r;
    }

    function clicking() {
      return hovering() && showing;
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
  new: function(slice) {
    //TODO: I want to be able to instantiate and move the Handle from the Slice, so 
    //we need to flesh out the Slice onject and refactor Chart so delegate drawing to the
    //slices themselves. So on calc_sizes we'll re-position each slice. This will aso 
    //allow for future animation I think. Each slice should know how to draw itself independently
    //from the rest of the chart.
    let button = Button.new();
  }
}

let Slice = {
  new: function() {
    let color_i = floor(random() * (COLOR_PALETTE.length - 1));
    let slice = {
      uuid: crypto.randomUUID(),
      name: '',
      color: COLOR_PALETTE[color_i],
      size: 1.0,
      hovering: false,
      selected: false,
    };
    return slice;
  }
}

let Chart = {
  new: function() {
    let pos = [0,0];
    let rad = 0;

    let slices = [];
    let total_size = 0;
    let selected_slice;

    let hovering = false;
    let mouse_listener;

    let add_button = AddButton.new();
    let remove_button = RemoveButton.new();
    let color_picker = ColorPicker.new();

    function calc_sizes() {
        let start = 0;
        let stop = 0;
        for (slice of slices) {
          start = stop;
          stop = stop + 2*PI * (slice.size / total_size);

          slice.start = start;
          slice.stop = stop;
        }
    }

    function add_slice() {
        let uuid = crypto.randomUUID();
        let size = 1.0;
        total_size += size;

        let slice = Slice.new();


        slices.push(slice);
        calc_sizes();
    }

    function remove_slice(uuid) {
          let remaining = slices.filter(s => {
            let match = s.uuid == uuid
            if (match) {
              total_size -= s.size;
            }
            return !match;
          });
          slices = remaining;
          calc_sizes();
    }

    let chart = {
      add_slice: add_slice,
      remove_slice: remove_slice,
      draw: function(p, r, canvas) {
        pos = [p[0] + width * 0.5, p[1] + height * 0.5];
        rad = r;

        ellipseMode(CENTER);

        let alpha = selected_slice ? 100 : 255;

        for (slice of slices) {

          let x = p[0];
          let y = p[1];
          
          if (slice.selected) {
            r = rad * 1.25;
            let a = (slice.stop+slice.start) / 2;
            if (a > 0) {
              x += 15 * cos(a);
              y += 15 * sin(a);
            }
            let c = color(slice.color[0], slice.color[1], slice.color[2], 255);
            fill(c);

            remove_button.show();
            add_button.hide();
          } else {
            let c = color(slice.color[0], slice.color[1], slice.color[2], alpha);
            fill(c);
            r = slice.hovering && !selected_slice ? rad * 1.15 : rad;
          }

          strokeWeight(1);
          stroke(240);
          
          arc(x, y, 2*r, 2*r, slice.start, slice.stop, PIE);
        }

        remove_button.draw();
        add_button.draw();
        color_picker.draw();
      },
    };

    document.addEventListener('mousemove', function(event) {
      const x = mouseX;
      const y = mouseY;

      //distance from circle
      let d = dist(x,y,pos[0],pos[1]);
      let was_hovering = hovering;
      hovering = d <= rad;
      if (!was_hovering && hovering) {
        add_button.hide();
      }
      if (was_hovering && !hovering) {
        if (!selected_slice) add_button.show();
      }

      //angle in percentage
      let a = atan2(y - pos[1], x - pos[0]);
      if (a < 0){
        a += 2*PI;
      }

      for (slice of slices) {
        slice.hovering = hovering && a > slice.start && a <= slice.stop;
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
        slice.selected = slice.hovering && slices.length > 1;
        if (slice.selected) {
          selected_slice = slice;
          remove_button.show();
        }
      }
      return;
    });
    return chart;
  }
}

let chart;

function setup() {
  createCanvas(400, 400); // Create a canvas of 400x400 pixels

  chart = Chart.new();
  
  chart.add_slice();

}

function draw() {
  clear();
  background(220);       // Set the background color

  let chart_p = [0, 0];
  let chart_r = width * 0.25;

  push();
  translate(width * 0.5, height * 0.5);

  chart.draw(chart_p, chart_r, canvas);

  pop();
}
