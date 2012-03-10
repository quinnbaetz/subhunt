function SubHuntAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

SubHuntAssistant.prototype.setup = function() {
			this.canvas = document.getElementById("canvas");
           	this.width = this.canvas.width;
            this.height = this.canvas.height;
			this.waterLevel = 100;
			this.shipLevel = 65;
            this.gameCounter = 0;
			this.spawnCounter = 0;
			this.torpCounter = 0;
			this.hits = 0;
			this.avoided = 0;
			this.charges = 0;
			this.score = 0;
			this.playing = true;
			this.gg = false;
            if (this.canvas.getContext) {
                this.ctx = this.canvas.getContext("2d");
                this.drawBackground();
                this.gs = {
                    ship: {
                        pos: 160,
						width: 40,
                        v: 0
                    },
                    lCharge: {
                        count: 5,
                        reload: 0
                    },
                    rCharge: {
                        count: 5,
                        reload: 0
                    },
                    charges: [],
                    submarines: [],
                    torpedoes: [],
					explosions: [],
					splashes: [],
                };
                this.gameStep();
            }
 
            setInterval(function(){
				this.gameStepSecond();
			}.bind(this), 1000);
			this.stop = 0;
			
			this.controller.listen("canvas", Mojo.Event.tap, this.charge.bind(this));
			this.controller.listen("canvas", Mojo.Event.keydown, this.move.bind(this));
}

SubHuntAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


SubHuntAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

SubHuntAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}


      		
SubHuntAssistant.prototype.gameStepSecond = function() {
				this.gameCounter++;
				this.spawnCounter++;
				this.torpCounter++;
}

SubHuntAssistant.prototype.gameStep = function() {
                this.canvas.width = this.canvas.width;
				var expectedSub = Math.pow(Math.E, -0.01 * this.gameCounter)*7 + 3;
				if (Math.random() < (1/(1+Math.pow(Math.E, 0 - (this.spawnCounter - expectedSub))))) {
					this.spawnCounter = 0;
					var x = this.width + 25;
					var v = -1;
					if (Math.random() < 0.5) {
						x = -25;
						v = 1;
					}
					v*=(Math.random()*1.5 + 1);
					var y = Math.floor(Math.random() * (this.height - (this.waterLevel) - 15) + this.waterLevel);
					
					this.gs.submarines.push({x:x, y:y, v:v});	
				}
				var expectedTorp = 0;
				if (Math.random() < (1 / (1 + Math.pow(Math.E, 0 - (this.torpCounter - expectedSub))))) {
					this.torpCounter = 0;
					if (this.gs.submarines.length != 0) {
						var sub = Math.floor(Math.random()* this.gs.submarines.length);
						sub = this.gs.submarines[sub];
						var ship = {
							x: this.gs.ship.pos,
							y: this.shipLevel
						};
						var dx = -1;
						if (sub.x < ship.x) {
							dx = 1;
						}
						var dy = 0;
						if (ship.x == sub.x) {
							dx = 0;
							dy = 1;
						}
						else {
							var ang = Math.atan((ship.y - sub.y) / (ship.x - sub.x));
							dx *= Math.cos(ang);
							dy = Math.sin(ang);
						}
						if (dy > 0) {
							dy *= -1;
						}
						this.gs.torpedoes.push({x:sub.x, y:sub.y, vx:dx, vy:dy});
					}
				}
                this.drawBackground();
                if (this.gs.lCharge.count < 5) {
                    this.gs.lCharge.reload++;
                    if (this.gs.lCharge.reload >= 30) {
                        this.gs.lCharge.count++;
                        this.gs.lCharge.reload = 0;
                    }
                }
                if (this.gs.rCharge.count < 5) {
                    this.gs.rCharge.reload++;
                    if (this.gs.rCharge.reload >= 30) {
                        this.gs.rCharge.count++;
                        this.gs.rCharge.reload = 0;
                    }
                }
                
                
                for (var i in this.gs) {
                    var obj = this.gs[i];
                    switch (i) {
                        case "ship":
							if (obj.v > 0) {
								clearInterval(this.stop);
								if (obj.v < 10) 
                            		obj.v+=.5;
                    			if (obj.pos + 25 < this.width) 
                        			obj.pos += obj.v;
							} else if (obj.v < 0) {
								clearInterval(this.stop);
								if (obj.v > -10) 
                                	obj.v-=.5;
                        		if (obj.pos - 25 > 0) 
                            		obj.pos += obj.v;
							}
                            this.drawShip(obj.pos);
                            break;
                        case "lCharge":
                            this.drawLMagazine(obj.count);
                            break;
                        case "rCharge":
                            this.drawRMagazine(obj.count);
                            break;
                        case "charges":
                            for (var j in obj) {
								if (obj[j].y >= obj[j].d) {
									this.gs.explosions.push({x: obj[j].x, y:obj[j].y, s:1, mult:1});
									obj.splice(j, 1);
								}
								else {
									this.drawCharge(obj[j]);
								}
                            }
                            break;
						case "explosions":
							for (var j in obj) {
								if (obj[j].s >= 6) {
									obj.splice(j, 1);
								} else {
									this.drawExplosion(obj[j]);
								}
							}
							break;
                        case "submarines":
                            for (var j in obj) {
								if (obj[j].x > this.width && obj[j].v > 0 || obj[j].x < 0 && obj[j].v < 0) {
									obj.splice(j, 1);
									this.avoided++;
									if (this.playing) {
										this.score -= 10;
									}
								} else {
									obj[j].x += obj[j].v;
									this.drawSubmarine(obj[j]);
								}
                            }
                            break;
                        case "torpedoes":
							for (var j in obj) {
								if (obj[j].y <= (this.waterLevel - 15)) {
									this.gs.splashes.push({x:obj[j].x, s:1});
									obj.splice(j, 1);
								} else {
									this.drawTorpedo(obj[j]);
								}
							}
                            break;
						case "splashes":
							for (var j in obj) {
								if (obj[j].s >= 6) {
									if (this.playing) {
										this.score += 5;
									}
									obj.splice(j, 1);
								} else {
									this.drawSplash(obj[j]);
								}
							}
							break;
                        default:
                            //console.log("not found: " + i);
                    }
                }
					if (!this.playing && this.gg) {
						this.explodeShip();
						this.explodeShip();
						this.explodeShip();
						this.explodeShip();
						this.ctx.fillStyle = "rgba(0, 0, 0, .3)";
						this.ctx.fillRect(0, 0, this.width, this.height);
						this.ctx.fillStyle = "#C0C0C0";
						this.ctx.fillRect(120, this.height / 2, 70, 20);
						this.ctx.fillStyle="#000000";
						this.ctx.font="10px sans-serif";
						this.ctx.fillText("New Game?", 125, this.height/2 + 10);
						
					}
					else 
						if (!this.playing) {
							this.ctx.fillStyle = "rgba(0, 0, 0, .3)";
							this.ctx.fillRect(0, 0, this.width, this.height);
							this.ctx.fillStyle = "#C0C0C0";
							this.ctx.fillRect(140, this.height / 2, 40, 20);
						}
						this.ctx.font="10px sans-serif";
						this.ctx.fillStyle="#black";
						this.ctx.fillText("hits: " + this.hits, 10, 30);
						this.ctx.fillText("charges: " + this.charges, 10, 40);
						this.ctx.fillText("Free Subs: " + this.avoided, 10, 50);
						
						this.ctx.fillText("Hit Rate: " + Math.floor(10000*this.hits/this.charges)/100 + "%", 10, 60);
						this.ctx.font="25px sans-serif";
						this.ctx.fillText(this.score, 130, 25);
						setTimeout(function(){
							this.gameStep();
						}.bind(this), 30);
						
				
				
                
            }
            
SubHuntAssistant.prototype.reticle = function(e) {
				//console.log(e);
			}
			
SubHuntAssistant.prototype.move = function(e){
				if(!this.playing) 
					return;
                var ship = this.gs.ship;
				
                if (e.keyCode == 39 || e.charCode == 100) {
                    if (ship.v <= 0) 
                        ship.v = 1; 
                }
                else 
                    if (e.keyCode == 37 || e.charCode == 97) {
                        if (ship.v >= 0) 
                            ship.v = -1; 
                            
                    }
            }
            
SubHuntAssistant.prototype.resetV = function(e){
				if (!this.playing)
					return;
				this.stop = setInterval("this.score++", 1000);
                this.gs.ship.v = 0;
            }
            
SubHuntAssistant.prototype.charge = function(e){
				if (!this.playing) {
					this.menu(e);
					return;
				}
					
                var click = e.clientX;
				var depth = e.clientY - 92;
				
				if (depth <= 0) return;
				this.charges++;
                var position = this.gs.ship.pos;
                if (click > position + 10) {
                    if (this.gs.rCharge.count > 0) {
                        this.gs.rCharge.count--;
                        this.gs.charges.push({
                            x: this.gs.ship.pos + 25,
                            y: 70,
							d: depth 
                        });
                    }
                }
                else {
                    if (this.gs.lCharge.count > 0) {
                        this.gs.lCharge.count--;
                        this.gs.charges.push({
                            x: this.gs.ship.pos - 30,
                            y: 70,
							d: depth
                        });
                    }
                }
            }
			
			
SubHuntAssistant.prototype.menu = function(e){
				var x = e.clientX;
				var y = e.clientY;
				if ( x <= 200 && x >= 130 && y >= 280 && y <= 300 ) {//brb, boy programming
					this.restartGame();
				}
			}
            
SubHuntAssistant.prototype.drawSubmarine = function(sub){
				this.ctx.beginPath();
                this.ctx.fillStyle = "rgba(0,0,0,.7)";
                this.ctx.moveTo(sub.x, sub.y);
				var x = sub.x;
				var y = sub.y;
                if (sub.v > 0) {
                    this.ctx.lineTo(x+= 5, y);
					this.ctx.lineTo(x, y-=5);
					this.ctx.lineTo(x+=5, y);
					this.ctx.lineTo(x, y+=5);
					this.ctx.lineTo(x+=12, y);
					this.ctx.arc(x, y+=5, 5, Math.PI/2, 3*Math.PI/2, true);
					this.ctx.lineTo(x, y+=5);
					this.ctx.lineTo(x-=25, y);
					this.ctx.lineTo(x-=3, y -= 3);
					this.ctx.lineTo(x-=3, y+=3);
					this.ctx.lineTo(x-=2, y);
					this.ctx.lineTo(x, y-=10);
					this.ctx.lineTo(x+=2, y);
					this.ctx.lineTo(x+=3, y+=3);
					this.ctx.lineTo(x+=3, y-=3);
					this.ctx.lineTo(sub.x, sub.y);
               }
                else {
                	this.ctx.lineTo(x-= 5, y);
					this.ctx.lineTo(x, y-=5);
					this.ctx.lineTo(x-=5, y);
					this.ctx.lineTo(x, y+=5);
					this.ctx.lineTo(x-=12, y);
					this.ctx.arc(x, y+=5, 5, Math.PI/2, 3*Math.PI/2, false);
					this.ctx.lineTo(x, y+=5);
					this.ctx.lineTo(x+=25, y);
					this.ctx.lineTo(x+=3, y -= 3);
					this.ctx.lineTo(x+=3, y+=3);
					this.ctx.lineTo(x+=2, y);
					this.ctx.lineTo(x, y-=10);
					this.ctx.lineTo(x-=2, y);
					this.ctx.lineTo(x-=3, y+=3);
					this.ctx.lineTo(x-=3, y-=3);
					this.ctx.lineTo(sub.x, sub.y);
               }
			   this.ctx.closePath();
			   this.ctx.fill();
            }
            
            
SubHuntAssistant.prototype.drawShip = function(x){
                this.ctx.fillStyle = "#CCCCFF";
                this.ctx.beginPath();
				var y = this.shipLevel;
				this.ctx.moveTo(x, y);
				this.ctx.lineTo(x+= 35, y);
				this.ctx.lineTo(x-=15, y+= 20);
				this.ctx.lineTo(x-=40, y);
				this.ctx.lineTo(x-=15, y-=20);
				this.ctx.lineTo(x+= 25, y);
				this.ctx.lineTo(x, y-=5);
				this.ctx.lineTo(x+=17, y);x
				this.ctx.lineTo(x, y-=10);
				this.ctx.lineTo(x+=7, y);
				this.ctx.lineTo(x, y+=15);
				this.ctx.closePath();
				this.ctx.fill();
				
                
            }
			
SubHuntAssistant.prototype.drawTorpedo = function(aTorp) {
				this.ctx.strokeStyle = "rgba(105, 105, 105, .75)";
				this.ctx.lineWidth = 3.0;
				this.ctx.strokeStyle="#C0C0C0";
				this.ctx.lineCap = "round";
				
				this.ctx.beginPath();
				this.ctx.moveTo(aTorp.x, aTorp.y);
				this.ctx.lineTo(aTorp.x + 7*aTorp.vx, aTorp.y + 7*aTorp.vy);
				this.ctx.stroke();
				this.ctx.beginPath();
				
				this.ctx.moveTo(aTorp.x - 3*aTorp.vx, aTorp.y - 3*aTorp.vy);
				this.ctx.lineTo(aTorp.x - 4*aTorp.vx, aTorp.y - 4*aTorp.vy);
				this.ctx.stroke();
				aTorp.x+=aTorp.vx;
				aTorp.y+=aTorp.vy;
				
				this.ctx.lineWidth = 1.0;
				var s = aTorp.vy/aTorp.vx;
					var d = aTorp.y - aTorp.x*s;
					this.ctx.beginPath();
					this.ctx.strokeStyle="#red";
					this.ctx.moveTo(0, d);
					this.ctx.lineTo(this.width, this.width*s + d);
					this.ctx.stroke();
			}
			
SubHuntAssistant.prototype.drawExplosion = function(anExp) {
				this.ctx.strokeStyle = "#FF0000";
				this.ctx.lineWidth = 2.0;
				
				var m = -Math.abs(anExp.s++ - 3) + 3;
				for (i = 1; i <= m; i++) {
					this.ctx.beginPath();					
					this.ctx.arc(anExp.x, anExp.y, i*5, 0, Math.PI*2, true);
					this.ctx.stroke();
				}
				for (var i in this.gs.torpedoes) {
					var aTorp = this.gs.torpedoes[i];
					var s = aTorp.vy/aTorp.vx;
					var d = aTorp.y - aTorp.x*s;
					//console.log("y = " + s + "x + " + b);
					var a = s*s + 1;
					var b = 2*s*d-2*anExp.x;
					var c = d*d + anExp.x * anExp.x - 25*m;
 
					var intx = b*b - 4*a*c;
					if (intx > 0) {
						intx = (-b + Math.sqrt(intx))/(2*a);
						//console.log(intx);
						if (intx <= aTorp.x - 3*aTorp.vx && intx >= aTorp.x + 7*aTorp.vx && aTorp.vx > 0 || intx >= aTorp.x - 3*aTorp.vx && intx <= aTorp.x + 7*aTorp.vx && aTorp.vx < 0) {
							//console.log("torp hit");
						}
						intx = -intx;
						if (intx <= aTorp.x - 3*aTorp.vx && intx >= aTorp.x + 7*aTorp.vx && aTorp.vx > 0 || intx >= aTorp.x - 3*aTorp.vx && intx <= aTorp.x + 7*aTorp.vx && aTorp.vx < 0) {
							//console.log("torp hit");
						}					}
					
				}
					for (var i in this.gs.submarines) {
						var sub = this.gs.submarines[i];
						var xleft = 0;
						var xright = 0;
						var ytop = 0;
						var ybottom = 0;
						if (sub.v > 0) {
							xleft = sub.x - 11;
							xright = sub.x + 24;
							ytop = sub.y - 5;
							ybottom = sub.y + 10;
						}
						else {
							xleft = sub.x - 24;
							xright = sub.x + 11;
							ytop = sub.y - 5;
							ybottom = sub.y + 10;
						}
						var hit = false;
						var num = Math.pow(m*5, 2) - Math.pow(ytop - anExp.y, 2);
						if (num >= 0 && !hit) {
							num = Math.sqrt(num);
							var intsct = num + anExp.x;
							if (intsct <= xright && intsct >= xleft) {
								hit = true;
							}
							else {
								num = -num;
								intsct = num + anExp.x;
								if (intsct <= xright && intsct >= xleft) {
									hit = true;
								}
							}
						}
						num = Math.pow(m*5, 2) - Math.pow(ybottom - anExp.y, 2);
						if (num >= 0 && !hit) {
							num = Math.sqrt(num);
							intsct = num + anExp.x;
							if (intsct <= xright && intsct >= xleft) {
								hit = true;
							}
							else {
								num = -num;
								intsct = num + anExp.x;
								if (intsct <= xright && intsct >= xleft) {
									hit = true;
								}
							}
						}
						num = Math.pow(m*5, 2) - Math.pow(xleft - anExp.x, 2);
						if (num >= 0 && !hit) {
							num = Math.sqrt(num);
							intsct = num + anExp.y;
							if (intsct <= ybottom && intsct >= ytop) {
								hit = true;
							}
							else {
								num = -num;
								intsct = num + anExp.y;
								if (intsct <= ybottom && intsct >= ytop) {
									hit = true;
								}
							}
						}
						num = Math.pow(m*5, 2) - Math.pow(xright - anExp.x, 2);
						if (num >= 0 && !hit) {
							num = Math.sqrt(num);
							intsct = num + anExp.y;
							if (intsct <= ybottom && intsct >= ytop) {
								hit = true;
							}
							else {
								num = -num;
								intsct = num + anExp.y;
								if (intsct <= ybottom && intsct >= ytop) {
									hit = true;
								}
							}
						}
						if (hit) {
							this.score+=100*anExp.mult;
							this.hits++;
							this.gs.explosions.push({x: sub.x, y:sub.y, s:1, mult:anExp.mult*2});
							this.gs.submarines.splice(i, 1);
						}
					}
			}
			
			
SubHuntAssistant.prototype.drawSplash = function(aSplash) {
				this.ctx.strokeStyle = "#FF0000";
				this.ctx.lineWidth = 2.0;
				
				var m = -Math.abs(aSplash.s++ - 3) + 3;
				for (i = 1; i <= m; i++) {
					this.ctx.beginPath();
					this.ctx.arc(aSplash.x, this.waterLevel - 15, i*5, 0, Math.PI, true);
					this.ctx.stroke();
				} if (this.playing) {
					if (m * 5 + aSplash.x > this.gs.ship.pos - this.gs.ship.width / 2 && m * 5 + aSplash.x < this.gs.ship.pos + this.gs.ship.width / 2) {
						this.gameOver();
					}
					else 
						if (aSplash.x - m * 5 < this.gs.ship.pos + this.gs.ship.width / 2 && aSplash.x - m * 5 > this.gs.ship.pos - this.gs.ship.width / 2) {
							this.gameOver();
						}
				}
				
			}
            
SubHuntAssistant.prototype.gameOver = function() {
				clearInterval(this.stop);
				this.gs.ship.v=0;
				this.playing = false;
				this.gg = true;
			}
			
SubHuntAssistant.prototype.drawLMagazine = function(count){
                this.ctx.fillStyle = "#000000";
                for (var i = 0; i < count; i++) {
                    this.ctx.fillRect(i * 10 + 10, 10, 5, 10);
                }
            }
            
SubHuntAssistant.prototype.drawRMagazine = function(count){
                this.ctx.fillStyle = "#000000";
                for (var i = 0; i < count; i++) {
                    this.ctx.fillRect(this.width - (i * 10 + 10), 10, 5, 10);
                }
            }
            
SubHuntAssistant.prototype.drawCharge = function(aCharge){
                this.ctx.fillStyle = "#000000";
                this.ctx.fillRect(aCharge.x, aCharge.y+=3, 5, 10);
                
            }
            
SubHuntAssistant.prototype.drawBackground = function(){
                this.ctx.fillStyle = "#0000ff";
                this.ctx.fillRect(0, 0, this.width, this.height);
                
 
   				this.ctx.beginPath();
 
                this.ctx.fillStyle = "#cyan";
                this.ctx.moveTo(0, 55);             
                this.ctx.fillRect(0, 0, this.width, 60);
                for (i = 0; i < this.width + 25; i += 30) {
                    this.ctx.arc(i, 55, 25, 0, Math.PI * 2, true);
                }
				this.ctx.closePath();
                this.ctx.fill();
            }
			
SubHuntAssistant.prototype.restartGame = function() {
				this.gs = {
                    ship: {
                        pos: 160,
						width: 40,
                        v: 0
                    },
                    lCharge: {
                        count: 5,
                        reload: 0
                    },
                    rCharge: {
                        count: 5,
                        reload: 0
                    },
                    charges: [],
                    submarines: [],
                    torpedoes: [],
					explosions: [],
					splashes: [],
                };
				this.gameCounter = 0;
				this.spawnCounter = 0;
				this.torpCounter = 0;
				this.hits = 0;
				this.avoided = 0;
				this.charges = 0;
				this.score = 0;
				this.playing = true;
				this.gg = false;
			}
			
SubHuntAssistant.prototype.explodeShip = function() {
				var red = Math.floor(Math.random()*256);
				var green = Math.floor(Math.random()*red);
				var x = Math.random()*60;
				var y = Math.random()*25;
				this.drawCircle("rgba(" + red + " ," +  green + " , 0, " + Math.random() + ")", this.gs.ship.pos - 35 + x, this.shipLevel - 5 + y, 10);
			}
SubHuntAssistant.prototype.drawCircle = function(color, x, y, radius) {
				this.ctx.beginPath();
				this.ctx.fillStyle = color;
				this.ctx.arc(x, y, radius, 0, Math.PI * 2, true);
				this.ctx.closePath();
				this.ctx.fill();
			}
