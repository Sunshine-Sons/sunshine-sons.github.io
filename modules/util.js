// Copyright © 2025 Sunshine Sons LLC. All rights reserved.

'use strict'

export const tau = 2 * Math.PI
export const phi = (Math.sqrt(5) - 1) / 2
export const phi2 = 2 * phi - phi * phi

export function assignIf(object, values) {
	if (object == null) {
		object = {}
		
		for (const key in values) {
			object[key] = values[key]
		}
	} else {
		for (const key in values) {
			if (!Object.hasOwn(object, key)) {
				object[key] = values[key]
			}
		}
	}
	
	return object
}

class DynamicColorComponent {
	constructor(args) {
		args = args || {}
		this.velocity = args.velocity || 0
		this.theta = args.theta || 0
	}
	
	update(deltaTime) {
		return this.theta = (this.theta + this.velocity * deltaTime) % tau
	}
	
	get(offset) {
		return (Math.sin(this.theta + (offset || 0)) + 1) / 2
	}
	
	getInt(offset) {
		return Math.floor(this.get(offset) * 0xFF)
	}
}

export class DynamicColor {
	constructor(args) {
		args = args || {}
		
		this.r = new DynamicColorComponent(args.r)
		this.g = new DynamicColorComponent(args.g)
		this.b = new DynamicColorComponent(args.b)
		
		if (args.elapse) {
			this.update(args.elapse)
		}
	}
	
	update(deltaTime) {
		this.r.update(deltaTime)
		this.g.update(deltaTime)
		this.b.update(deltaTime)
	}
	
	getInt(offset) {
		return (this.r.getInt(offset) << 16) | (this.g.getInt(offset) << 8) | this.b.getInt(offset)
	}
}

// https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
// http://detectmobilebrowsers.com/
export function checkMobile() {
  let check = false
  ;(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera)
  return check
}

// https://stackoverflow.com/questions/4907843/open-a-url-in-a-new-tab-and-not-a-new-window
export function openInNewTab(url) {
	window.open(url, '_blank', 'noopener,noreferrer').focus()
}

export function onKeyDown(callback) {
	window.addEventListener('keydown', function(event) {
		if (callback(event.keyCode)) {
			event.preventDefault()
		}
	})
}

export function toggleFullscreen() {
	if (document.fullscreen) {
		document.exitFullscreen()
	} else {
		document.body.requestFullscreen()
	}
}

export function isWebGlSupported() { 
	try {
		let canvas = document.createElement('canvas')
		return !!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
	} catch(e) {
		return false
	}
}
