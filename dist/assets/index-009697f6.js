(function () {
	const t = document.createElement('link').relList;
	if (t && t.supports && t.supports('modulepreload')) return;
	for (const l of document.querySelectorAll('link[rel="modulepreload"]')) r(l);
	new MutationObserver(l => {
		for (const i of l)
			if (i.type === 'childList')
				for (const o of i.addedNodes) o.tagName === 'LINK' && o.rel === 'modulepreload' && r(o);
	}).observe(document, { childList: !0, subtree: !0 });
	function n(l) {
		const i = {};
		return (
			l.integrity && (i.integrity = l.integrity),
			l.referrerpolicy && (i.referrerPolicy = l.referrerpolicy),
			l.crossorigin === 'use-credentials'
				? (i.credentials = 'include')
				: l.crossorigin === 'anonymous'
					? (i.credentials = 'omit')
					: (i.credentials = 'same-origin'),
			i
		);
	}
	function r(l) {
		if (l.ep) return;
		l.ep = !0;
		const i = n(l);
		fetch(l.href, i);
	}
})();
var ut =
	typeof globalThis < 'u'
		? globalThis
		: typeof window < 'u'
			? window
			: typeof global < 'u'
				? global
				: typeof self < 'u'
					? self
					: {};
function Zs(e) {
	return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
}
var Xn = {},
	Tf = {
		get exports() {
			return Xn;
		},
		set exports(e) {
			Xn = e;
		},
	},
	Tl = {},
	L = {},
	Lf = {
		get exports() {
			return L;
		},
		set exports(e) {
			L = e;
		},
	},
	D = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var hr = Symbol.for('react.element'),
	zf = Symbol.for('react.portal'),
	Of = Symbol.for('react.fragment'),
	Mf = Symbol.for('react.strict_mode'),
	Rf = Symbol.for('react.profiler'),
	jf = Symbol.for('react.provider'),
	Df = Symbol.for('react.context'),
	Ff = Symbol.for('react.forward_ref'),
	If = Symbol.for('react.suspense'),
	$f = Symbol.for('react.memo'),
	Af = Symbol.for('react.lazy'),
	Ea = Symbol.iterator;
function Uf(e) {
	return e === null || typeof e != 'object'
		? null
		: ((e = (Ea && e[Ea]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var Js = {
		isMounted: function () {
			return !1;
		},
		enqueueForceUpdate: function () {},
		enqueueReplaceState: function () {},
		enqueueSetState: function () {},
	},
	bs = Object.assign,
	eu = {};
function Cn(e, t, n) {
	((this.props = e), (this.context = t), (this.refs = eu), (this.updater = n || Js));
}
Cn.prototype.isReactComponent = {};
Cn.prototype.setState = function (e, t) {
	if (typeof e != 'object' && typeof e != 'function' && e != null)
		throw Error(
			'setState(...): takes an object of state variables to update or a function which returns an object of state variables.',
		);
	this.updater.enqueueSetState(this, e, t, 'setState');
};
Cn.prototype.forceUpdate = function (e) {
	this.updater.enqueueForceUpdate(this, e, 'forceUpdate');
};
function tu() {}
tu.prototype = Cn.prototype;
function No(e, t, n) {
	((this.props = e), (this.context = t), (this.refs = eu), (this.updater = n || Js));
}
var _o = (No.prototype = new tu());
_o.constructor = No;
bs(_o, Cn.prototype);
_o.isPureReactComponent = !0;
var Ca = Array.isArray,
	nu = Object.prototype.hasOwnProperty,
	Po = { current: null },
	ru = { key: !0, ref: !0, __self: !0, __source: !0 };
function lu(e, t, n) {
	var r,
		l = {},
		i = null,
		o = null;
	if (t != null)
		for (r in (t.ref !== void 0 && (o = t.ref), t.key !== void 0 && (i = '' + t.key), t))
			nu.call(t, r) && !ru.hasOwnProperty(r) && (l[r] = t[r]);
	var a = arguments.length - 2;
	if (a === 1) l.children = n;
	else if (1 < a) {
		for (var s = Array(a), u = 0; u < a; u++) s[u] = arguments[u + 2];
		l.children = s;
	}
	if (e && e.defaultProps) for (r in ((a = e.defaultProps), a)) l[r] === void 0 && (l[r] = a[r]);
	return { $$typeof: hr, type: e, key: i, ref: o, props: l, _owner: Po.current };
}
function Bf(e, t) {
	return { $$typeof: hr, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function To(e) {
	return typeof e == 'object' && e !== null && e.$$typeof === hr;
}
function Wf(e) {
	var t = { '=': '=0', ':': '=2' };
	return (
		'$' +
		e.replace(/[=:]/g, function (n) {
			return t[n];
		})
	);
}
var Na = /\/+/g;
function Gl(e, t) {
	return typeof e == 'object' && e !== null && e.key != null ? Wf('' + e.key) : t.toString(36);
}
function Hr(e, t, n, r, l) {
	var i = typeof e;
	(i === 'undefined' || i === 'boolean') && (e = null);
	var o = !1;
	if (e === null) o = !0;
	else
		switch (i) {
			case 'string':
			case 'number':
				o = !0;
				break;
			case 'object':
				switch (e.$$typeof) {
					case hr:
					case zf:
						o = !0;
				}
		}
	if (o)
		return (
			(o = e),
			(l = l(o)),
			(e = r === '' ? '.' + Gl(o, 0) : r),
			Ca(l)
				? ((n = ''),
					e != null && (n = e.replace(Na, '$&/') + '/'),
					Hr(l, t, n, '', function (u) {
						return u;
					}))
				: l != null &&
					(To(l) &&
						(l = Bf(
							l,
							n + (!l.key || (o && o.key === l.key) ? '' : ('' + l.key).replace(Na, '$&/') + '/') + e,
						)),
					t.push(l)),
			1
		);
	if (((o = 0), (r = r === '' ? '.' : r + ':'), Ca(e)))
		for (var a = 0; a < e.length; a++) {
			i = e[a];
			var s = r + Gl(i, a);
			o += Hr(i, t, n, s, l);
		}
	else if (((s = Uf(e)), typeof s == 'function'))
		for (e = s.call(e), a = 0; !(i = e.next()).done; )
			((i = i.value), (s = r + Gl(i, a++)), (o += Hr(i, t, n, s, l)));
	else if (i === 'object')
		throw (
			(t = String(e)),
			Error(
				'Objects are not valid as a React child (found: ' +
					(t === '[object Object]' ? 'object with keys {' + Object.keys(e).join(', ') + '}' : t) +
					'). If you meant to render a collection of children, use an array instead.',
			)
		);
	return o;
}
function Cr(e, t, n) {
	if (e == null) return e;
	var r = [],
		l = 0;
	return (
		Hr(e, r, '', '', function (i) {
			return t.call(n, i, l++);
		}),
		r
	);
}
function Hf(e) {
	if (e._status === -1) {
		var t = e._result;
		((t = t()),
			t.then(
				function (n) {
					(e._status === 0 || e._status === -1) && ((e._status = 1), (e._result = n));
				},
				function (n) {
					(e._status === 0 || e._status === -1) && ((e._status = 2), (e._result = n));
				},
			),
			e._status === -1 && ((e._status = 0), (e._result = t)));
	}
	if (e._status === 1) return e._result.default;
	throw e._result;
}
var fe = { current: null },
	Vr = { transition: null },
	Vf = { ReactCurrentDispatcher: fe, ReactCurrentBatchConfig: Vr, ReactCurrentOwner: Po };
D.Children = {
	map: Cr,
	forEach: function (e, t, n) {
		Cr(
			e,
			function () {
				t.apply(this, arguments);
			},
			n,
		);
	},
	count: function (e) {
		var t = 0;
		return (
			Cr(e, function () {
				t++;
			}),
			t
		);
	},
	toArray: function (e) {
		return (
			Cr(e, function (t) {
				return t;
			}) || []
		);
	},
	only: function (e) {
		if (!To(e)) throw Error('React.Children.only expected to receive a single React element child.');
		return e;
	},
};
D.Component = Cn;
D.Fragment = Of;
D.Profiler = Rf;
D.PureComponent = No;
D.StrictMode = Mf;
D.Suspense = If;
D.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Vf;
D.cloneElement = function (e, t, n) {
	if (e == null)
		throw Error('React.cloneElement(...): The argument must be a React element, but you passed ' + e + '.');
	var r = bs({}, e.props),
		l = e.key,
		i = e.ref,
		o = e._owner;
	if (t != null) {
		if (
			(t.ref !== void 0 && ((i = t.ref), (o = Po.current)),
			t.key !== void 0 && (l = '' + t.key),
			e.type && e.type.defaultProps)
		)
			var a = e.type.defaultProps;
		for (s in t) nu.call(t, s) && !ru.hasOwnProperty(s) && (r[s] = t[s] === void 0 && a !== void 0 ? a[s] : t[s]);
	}
	var s = arguments.length - 2;
	if (s === 1) r.children = n;
	else if (1 < s) {
		a = Array(s);
		for (var u = 0; u < s; u++) a[u] = arguments[u + 2];
		r.children = a;
	}
	return { $$typeof: hr, type: e.type, key: l, ref: i, props: r, _owner: o };
};
D.createContext = function (e) {
	return (
		(e = {
			$$typeof: Df,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null,
			_defaultValue: null,
			_globalName: null,
		}),
		(e.Provider = { $$typeof: jf, _context: e }),
		(e.Consumer = e)
	);
};
D.createElement = lu;
D.createFactory = function (e) {
	var t = lu.bind(null, e);
	return ((t.type = e), t);
};
D.createRef = function () {
	return { current: null };
};
D.forwardRef = function (e) {
	return { $$typeof: Ff, render: e };
};
D.isValidElement = To;
D.lazy = function (e) {
	return { $$typeof: Af, _payload: { _status: -1, _result: e }, _init: Hf };
};
D.memo = function (e, t) {
	return { $$typeof: $f, type: e, compare: t === void 0 ? null : t };
};
D.startTransition = function (e) {
	var t = Vr.transition;
	Vr.transition = {};
	try {
		e();
	} finally {
		Vr.transition = t;
	}
};
D.unstable_act = function () {
	throw Error('act(...) is not supported in production builds of React.');
};
D.useCallback = function (e, t) {
	return fe.current.useCallback(e, t);
};
D.useContext = function (e) {
	return fe.current.useContext(e);
};
D.useDebugValue = function () {};
D.useDeferredValue = function (e) {
	return fe.current.useDeferredValue(e);
};
D.useEffect = function (e, t) {
	return fe.current.useEffect(e, t);
};
D.useId = function () {
	return fe.current.useId();
};
D.useImperativeHandle = function (e, t, n) {
	return fe.current.useImperativeHandle(e, t, n);
};
D.useInsertionEffect = function (e, t) {
	return fe.current.useInsertionEffect(e, t);
};
D.useLayoutEffect = function (e, t) {
	return fe.current.useLayoutEffect(e, t);
};
D.useMemo = function (e, t) {
	return fe.current.useMemo(e, t);
};
D.useReducer = function (e, t, n) {
	return fe.current.useReducer(e, t, n);
};
D.useRef = function (e) {
	return fe.current.useRef(e);
};
D.useState = function (e) {
	return fe.current.useState(e);
};
D.useSyncExternalStore = function (e, t, n) {
	return fe.current.useSyncExternalStore(e, t, n);
};
D.useTransition = function () {
	return fe.current.useTransition();
};
D.version = '18.2.0';
(function (e) {
	e.exports = D;
})(Lf);
const Be = Zs(L);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Qf = L,
	Kf = Symbol.for('react.element'),
	Yf = Symbol.for('react.fragment'),
	Gf = Object.prototype.hasOwnProperty,
	Xf = Qf.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
	qf = { key: !0, ref: !0, __self: !0, __source: !0 };
function iu(e, t, n) {
	var r,
		l = {},
		i = null,
		o = null;
	(n !== void 0 && (i = '' + n), t.key !== void 0 && (i = '' + t.key), t.ref !== void 0 && (o = t.ref));
	for (r in t) Gf.call(t, r) && !qf.hasOwnProperty(r) && (l[r] = t[r]);
	if (e && e.defaultProps) for (r in ((t = e.defaultProps), t)) l[r] === void 0 && (l[r] = t[r]);
	return { $$typeof: Kf, type: e, key: i, ref: o, props: l, _owner: Xf.current };
}
Tl.Fragment = Yf;
Tl.jsx = iu;
Tl.jsxs = iu;
(function (e) {
	e.exports = Tl;
})(Tf);
const Zf = Xn.Fragment,
	d = Xn.jsx,
	_ = Xn.jsxs;
var Ci = {},
	nl = {},
	Jf = {
		get exports() {
			return nl;
		},
		set exports(e) {
			nl = e;
		},
	},
	Se = {},
	Ni = {},
	bf = {
		get exports() {
			return Ni;
		},
		set exports(e) {
			Ni = e;
		},
	},
	ou = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
	function t(T, M) {
		var R = T.length;
		T.push(M);
		e: for (; 0 < R; ) {
			var G = (R - 1) >>> 1,
				b = T[G];
			if (0 < l(b, M)) ((T[G] = M), (T[R] = b), (R = G));
			else break e;
		}
	}
	function n(T) {
		return T.length === 0 ? null : T[0];
	}
	function r(T) {
		if (T.length === 0) return null;
		var M = T[0],
			R = T.pop();
		if (R !== M) {
			T[0] = R;
			e: for (var G = 0, b = T.length, Sr = b >>> 1; G < Sr; ) {
				var Tt = 2 * (G + 1) - 1,
					Yl = T[Tt],
					Lt = Tt + 1,
					Er = T[Lt];
				if (0 > l(Yl, R))
					Lt < b && 0 > l(Er, Yl)
						? ((T[G] = Er), (T[Lt] = R), (G = Lt))
						: ((T[G] = Yl), (T[Tt] = R), (G = Tt));
				else if (Lt < b && 0 > l(Er, R)) ((T[G] = Er), (T[Lt] = R), (G = Lt));
				else break e;
			}
		}
		return M;
	}
	function l(T, M) {
		var R = T.sortIndex - M.sortIndex;
		return R !== 0 ? R : T.id - M.id;
	}
	if (typeof performance == 'object' && typeof performance.now == 'function') {
		var i = performance;
		e.unstable_now = function () {
			return i.now();
		};
	} else {
		var o = Date,
			a = o.now();
		e.unstable_now = function () {
			return o.now() - a;
		};
	}
	var s = [],
		u = [],
		m = 1,
		v = null,
		h = 3,
		w = !1,
		C = !1,
		N = !1,
		j = typeof setTimeout == 'function' ? setTimeout : null,
		f = typeof clearTimeout == 'function' ? clearTimeout : null,
		c = typeof setImmediate < 'u' ? setImmediate : null;
	typeof navigator < 'u' &&
		navigator.scheduling !== void 0 &&
		navigator.scheduling.isInputPending !== void 0 &&
		navigator.scheduling.isInputPending.bind(navigator.scheduling);
	function p(T) {
		for (var M = n(u); M !== null; ) {
			if (M.callback === null) r(u);
			else if (M.startTime <= T) (r(u), (M.sortIndex = M.expirationTime), t(s, M));
			else break;
			M = n(u);
		}
	}
	function y(T) {
		if (((N = !1), p(T), !C))
			if (n(s) !== null) ((C = !0), Ql(E));
			else {
				var M = n(u);
				M !== null && Kl(y, M.startTime - T);
			}
	}
	function E(T, M) {
		((C = !1), N && ((N = !1), f(k), (k = -1)), (w = !0));
		var R = h;
		try {
			for (p(M), v = n(s); v !== null && (!(v.expirationTime > M) || (T && !W())); ) {
				var G = v.callback;
				if (typeof G == 'function') {
					((v.callback = null), (h = v.priorityLevel));
					var b = G(v.expirationTime <= M);
					((M = e.unstable_now()), typeof b == 'function' ? (v.callback = b) : v === n(s) && r(s), p(M));
				} else r(s);
				v = n(s);
			}
			if (v !== null) var Sr = !0;
			else {
				var Tt = n(u);
				(Tt !== null && Kl(y, Tt.startTime - M), (Sr = !1));
			}
			return Sr;
		} finally {
			((v = null), (h = R), (w = !1));
		}
	}
	var x = !1,
		g = null,
		k = -1,
		O = 5,
		z = -1;
	function W() {
		return !(e.unstable_now() - z < O);
	}
	function Ce() {
		if (g !== null) {
			var T = e.unstable_now();
			z = T;
			var M = !0;
			try {
				M = g(!0, T);
			} finally {
				M ? Qe() : ((x = !1), (g = null));
			}
		} else x = !1;
	}
	var Qe;
	if (typeof c == 'function')
		Qe = function () {
			c(Ce);
		};
	else if (typeof MessageChannel < 'u') {
		var Pt = new MessageChannel(),
			Sa = Pt.port2;
		((Pt.port1.onmessage = Ce),
			(Qe = function () {
				Sa.postMessage(null);
			}));
	} else
		Qe = function () {
			j(Ce, 0);
		};
	function Ql(T) {
		((g = T), x || ((x = !0), Qe()));
	}
	function Kl(T, M) {
		k = j(function () {
			T(e.unstable_now());
		}, M);
	}
	((e.unstable_IdlePriority = 5),
		(e.unstable_ImmediatePriority = 1),
		(e.unstable_LowPriority = 4),
		(e.unstable_NormalPriority = 3),
		(e.unstable_Profiling = null),
		(e.unstable_UserBlockingPriority = 2),
		(e.unstable_cancelCallback = function (T) {
			T.callback = null;
		}),
		(e.unstable_continueExecution = function () {
			C || w || ((C = !0), Ql(E));
		}),
		(e.unstable_forceFrameRate = function (T) {
			0 > T || 125 < T
				? console.error(
						'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported',
					)
				: (O = 0 < T ? Math.floor(1e3 / T) : 5);
		}),
		(e.unstable_getCurrentPriorityLevel = function () {
			return h;
		}),
		(e.unstable_getFirstCallbackNode = function () {
			return n(s);
		}),
		(e.unstable_next = function (T) {
			switch (h) {
				case 1:
				case 2:
				case 3:
					var M = 3;
					break;
				default:
					M = h;
			}
			var R = h;
			h = M;
			try {
				return T();
			} finally {
				h = R;
			}
		}),
		(e.unstable_pauseExecution = function () {}),
		(e.unstable_requestPaint = function () {}),
		(e.unstable_runWithPriority = function (T, M) {
			switch (T) {
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
					break;
				default:
					T = 3;
			}
			var R = h;
			h = T;
			try {
				return M();
			} finally {
				h = R;
			}
		}),
		(e.unstable_scheduleCallback = function (T, M, R) {
			var G = e.unstable_now();
			switch (
				(typeof R == 'object' && R !== null
					? ((R = R.delay), (R = typeof R == 'number' && 0 < R ? G + R : G))
					: (R = G),
				T)
			) {
				case 1:
					var b = -1;
					break;
				case 2:
					b = 250;
					break;
				case 5:
					b = 1073741823;
					break;
				case 4:
					b = 1e4;
					break;
				default:
					b = 5e3;
			}
			return (
				(b = R + b),
				(T = { id: m++, callback: M, priorityLevel: T, startTime: R, expirationTime: b, sortIndex: -1 }),
				R > G
					? ((T.sortIndex = R),
						t(u, T),
						n(s) === null && T === n(u) && (N ? (f(k), (k = -1)) : (N = !0), Kl(y, R - G)))
					: ((T.sortIndex = b), t(s, T), C || w || ((C = !0), Ql(E))),
				T
			);
		}),
		(e.unstable_shouldYield = W),
		(e.unstable_wrapCallback = function (T) {
			var M = h;
			return function () {
				var R = h;
				h = M;
				try {
					return T.apply(this, arguments);
				} finally {
					h = R;
				}
			};
		}));
})(ou);
(function (e) {
	e.exports = ou;
})(bf);
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var au = L,
	ke = Ni;
function S(e) {
	for (var t = 'https://reactjs.org/docs/error-decoder.html?invariant=' + e, n = 1; n < arguments.length; n++)
		t += '&args[]=' + encodeURIComponent(arguments[n]);
	return (
		'Minified React error #' +
		e +
		'; visit ' +
		t +
		' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
	);
}
var su = new Set(),
	qn = {};
function Kt(e, t) {
	(gn(e, t), gn(e + 'Capture', t));
}
function gn(e, t) {
	for (qn[e] = t, e = 0; e < t.length; e++) su.add(t[e]);
}
var Je = !(typeof window > 'u' || typeof window.document > 'u' || typeof window.document.createElement > 'u'),
	_i = Object.prototype.hasOwnProperty,
	ed =
		/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
	_a = {},
	Pa = {};
function td(e) {
	return _i.call(Pa, e) ? !0 : _i.call(_a, e) ? !1 : ed.test(e) ? (Pa[e] = !0) : ((_a[e] = !0), !1);
}
function nd(e, t, n, r) {
	if (n !== null && n.type === 0) return !1;
	switch (typeof t) {
		case 'function':
		case 'symbol':
			return !0;
		case 'boolean':
			return r
				? !1
				: n !== null
					? !n.acceptsBooleans
					: ((e = e.toLowerCase().slice(0, 5)), e !== 'data-' && e !== 'aria-');
		default:
			return !1;
	}
}
function rd(e, t, n, r) {
	if (t === null || typeof t > 'u' || nd(e, t, n, r)) return !0;
	if (r) return !1;
	if (n !== null)
		switch (n.type) {
			case 3:
				return !t;
			case 4:
				return t === !1;
			case 5:
				return isNaN(t);
			case 6:
				return isNaN(t) || 1 > t;
		}
	return !1;
}
function de(e, t, n, r, l, i, o) {
	((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
		(this.attributeName = r),
		(this.attributeNamespace = l),
		(this.mustUseProperty = n),
		(this.propertyName = e),
		(this.type = t),
		(this.sanitizeURL = i),
		(this.removeEmptyString = o));
}
var le = {};
'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
	.split(' ')
	.forEach(function (e) {
		le[e] = new de(e, 0, !1, e, null, !1, !1);
	});
[
	['acceptCharset', 'accept-charset'],
	['className', 'class'],
	['htmlFor', 'for'],
	['httpEquiv', 'http-equiv'],
].forEach(function (e) {
	var t = e[0];
	le[t] = new de(t, 1, !1, e[1], null, !1, !1);
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
	le[e] = new de(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (e) {
	le[e] = new de(e, 2, !1, e, null, !1, !1);
});
'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
	.split(' ')
	.forEach(function (e) {
		le[e] = new de(e, 3, !1, e.toLowerCase(), null, !1, !1);
	});
['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
	le[e] = new de(e, 3, !0, e, null, !1, !1);
});
['capture', 'download'].forEach(function (e) {
	le[e] = new de(e, 4, !1, e, null, !1, !1);
});
['cols', 'rows', 'size', 'span'].forEach(function (e) {
	le[e] = new de(e, 6, !1, e, null, !1, !1);
});
['rowSpan', 'start'].forEach(function (e) {
	le[e] = new de(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Lo = /[\-:]([a-z])/g;
function zo(e) {
	return e[1].toUpperCase();
}
'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
	.split(' ')
	.forEach(function (e) {
		var t = e.replace(Lo, zo);
		le[t] = new de(t, 1, !1, e, null, !1, !1);
	});
'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'.split(' ').forEach(function (e) {
	var t = e.replace(Lo, zo);
	le[t] = new de(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
});
['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
	var t = e.replace(Lo, zo);
	le[t] = new de(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
});
['tabIndex', 'crossOrigin'].forEach(function (e) {
	le[e] = new de(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
le.xlinkHref = new de('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1);
['src', 'href', 'action', 'formAction'].forEach(function (e) {
	le[e] = new de(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Oo(e, t, n, r) {
	var l = le.hasOwnProperty(t) ? le[t] : null;
	(l !== null
		? l.type !== 0
		: r || !(2 < t.length) || (t[0] !== 'o' && t[0] !== 'O') || (t[1] !== 'n' && t[1] !== 'N')) &&
		(rd(t, n, l, r) && (n = null),
		r || l === null
			? td(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, '' + n))
			: l.mustUseProperty
				? (e[l.propertyName] = n === null ? (l.type === 3 ? !1 : '') : n)
				: ((t = l.attributeName),
					(r = l.attributeNamespace),
					n === null
						? e.removeAttribute(t)
						: ((l = l.type),
							(n = l === 3 || (l === 4 && n === !0) ? '' : '' + n),
							r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var nt = au.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
	Nr = Symbol.for('react.element'),
	Jt = Symbol.for('react.portal'),
	bt = Symbol.for('react.fragment'),
	Mo = Symbol.for('react.strict_mode'),
	Pi = Symbol.for('react.profiler'),
	uu = Symbol.for('react.provider'),
	cu = Symbol.for('react.context'),
	Ro = Symbol.for('react.forward_ref'),
	Ti = Symbol.for('react.suspense'),
	Li = Symbol.for('react.suspense_list'),
	jo = Symbol.for('react.memo'),
	it = Symbol.for('react.lazy'),
	fu = Symbol.for('react.offscreen'),
	Ta = Symbol.iterator;
function Pn(e) {
	return e === null || typeof e != 'object'
		? null
		: ((e = (Ta && e[Ta]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var Q = Object.assign,
	Xl;
function Dn(e) {
	if (Xl === void 0)
		try {
			throw Error();
		} catch (n) {
			var t = n.stack.trim().match(/\n( *(at )?)/);
			Xl = (t && t[1]) || '';
		}
	return (
		`
` +
		Xl +
		e
	);
}
var ql = !1;
function Zl(e, t) {
	if (!e || ql) return '';
	ql = !0;
	var n = Error.prepareStackTrace;
	Error.prepareStackTrace = void 0;
	try {
		if (t)
			if (
				((t = function () {
					throw Error();
				}),
				Object.defineProperty(t.prototype, 'props', {
					set: function () {
						throw Error();
					},
				}),
				typeof Reflect == 'object' && Reflect.construct)
			) {
				try {
					Reflect.construct(t, []);
				} catch (u) {
					var r = u;
				}
				Reflect.construct(e, [], t);
			} else {
				try {
					t.call();
				} catch (u) {
					r = u;
				}
				e.call(t.prototype);
			}
		else {
			try {
				throw Error();
			} catch (u) {
				r = u;
			}
			e();
		}
	} catch (u) {
		if (u && r && typeof u.stack == 'string') {
			for (
				var l = u.stack.split(`
`),
					i = r.stack.split(`
`),
					o = l.length - 1,
					a = i.length - 1;
				1 <= o && 0 <= a && l[o] !== i[a];

			)
				a--;
			for (; 1 <= o && 0 <= a; o--, a--)
				if (l[o] !== i[a]) {
					if (o !== 1 || a !== 1)
						do
							if ((o--, a--, 0 > a || l[o] !== i[a])) {
								var s =
									`
` + l[o].replace(' at new ', ' at ');
								return (
									e.displayName &&
										s.includes('<anonymous>') &&
										(s = s.replace('<anonymous>', e.displayName)),
									s
								);
							}
						while (1 <= o && 0 <= a);
					break;
				}
		}
	} finally {
		((ql = !1), (Error.prepareStackTrace = n));
	}
	return (e = e ? e.displayName || e.name : '') ? Dn(e) : '';
}
function ld(e) {
	switch (e.tag) {
		case 5:
			return Dn(e.type);
		case 16:
			return Dn('Lazy');
		case 13:
			return Dn('Suspense');
		case 19:
			return Dn('SuspenseList');
		case 0:
		case 2:
		case 15:
			return ((e = Zl(e.type, !1)), e);
		case 11:
			return ((e = Zl(e.type.render, !1)), e);
		case 1:
			return ((e = Zl(e.type, !0)), e);
		default:
			return '';
	}
}
function zi(e) {
	if (e == null) return null;
	if (typeof e == 'function') return e.displayName || e.name || null;
	if (typeof e == 'string') return e;
	switch (e) {
		case bt:
			return 'Fragment';
		case Jt:
			return 'Portal';
		case Pi:
			return 'Profiler';
		case Mo:
			return 'StrictMode';
		case Ti:
			return 'Suspense';
		case Li:
			return 'SuspenseList';
	}
	if (typeof e == 'object')
		switch (e.$$typeof) {
			case cu:
				return (e.displayName || 'Context') + '.Consumer';
			case uu:
				return (e._context.displayName || 'Context') + '.Provider';
			case Ro:
				var t = e.render;
				return (
					(e = e.displayName),
					e || ((e = t.displayName || t.name || ''), (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
					e
				);
			case jo:
				return ((t = e.displayName || null), t !== null ? t : zi(e.type) || 'Memo');
			case it:
				((t = e._payload), (e = e._init));
				try {
					return zi(e(t));
				} catch {}
		}
	return null;
}
function id(e) {
	var t = e.type;
	switch (e.tag) {
		case 24:
			return 'Cache';
		case 9:
			return (t.displayName || 'Context') + '.Consumer';
		case 10:
			return (t._context.displayName || 'Context') + '.Provider';
		case 18:
			return 'DehydratedFragment';
		case 11:
			return (
				(e = t.render),
				(e = e.displayName || e.name || ''),
				t.displayName || (e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')
			);
		case 7:
			return 'Fragment';
		case 5:
			return t;
		case 4:
			return 'Portal';
		case 3:
			return 'Root';
		case 6:
			return 'Text';
		case 16:
			return zi(t);
		case 8:
			return t === Mo ? 'StrictMode' : 'Mode';
		case 22:
			return 'Offscreen';
		case 12:
			return 'Profiler';
		case 21:
			return 'Scope';
		case 13:
			return 'Suspense';
		case 19:
			return 'SuspenseList';
		case 25:
			return 'TracingMarker';
		case 1:
		case 0:
		case 17:
		case 2:
		case 14:
		case 15:
			if (typeof t == 'function') return t.displayName || t.name || null;
			if (typeof t == 'string') return t;
	}
	return null;
}
function St(e) {
	switch (typeof e) {
		case 'boolean':
		case 'number':
		case 'string':
		case 'undefined':
			return e;
		case 'object':
			return e;
		default:
			return '';
	}
}
function du(e) {
	var t = e.type;
	return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio');
}
function od(e) {
	var t = du(e) ? 'checked' : 'value',
		n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
		r = '' + e[t];
	if (!e.hasOwnProperty(t) && typeof n < 'u' && typeof n.get == 'function' && typeof n.set == 'function') {
		var l = n.get,
			i = n.set;
		return (
			Object.defineProperty(e, t, {
				configurable: !0,
				get: function () {
					return l.call(this);
				},
				set: function (o) {
					((r = '' + o), i.call(this, o));
				},
			}),
			Object.defineProperty(e, t, { enumerable: n.enumerable }),
			{
				getValue: function () {
					return r;
				},
				setValue: function (o) {
					r = '' + o;
				},
				stopTracking: function () {
					((e._valueTracker = null), delete e[t]);
				},
			}
		);
	}
}
function _r(e) {
	e._valueTracker || (e._valueTracker = od(e));
}
function pu(e) {
	if (!e) return !1;
	var t = e._valueTracker;
	if (!t) return !0;
	var n = t.getValue(),
		r = '';
	return (e && (r = du(e) ? (e.checked ? 'true' : 'false') : e.value), (e = r), e !== n ? (t.setValue(e), !0) : !1);
}
function rl(e) {
	if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
	try {
		return e.activeElement || e.body;
	} catch {
		return e.body;
	}
}
function Oi(e, t) {
	var n = t.checked;
	return Q({}, t, {
		defaultChecked: void 0,
		defaultValue: void 0,
		value: void 0,
		checked: n ?? e._wrapperState.initialChecked,
	});
}
function La(e, t) {
	var n = t.defaultValue == null ? '' : t.defaultValue,
		r = t.checked != null ? t.checked : t.defaultChecked;
	((n = St(t.value != null ? t.value : n)),
		(e._wrapperState = {
			initialChecked: r,
			initialValue: n,
			controlled: t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
		}));
}
function mu(e, t) {
	((t = t.checked), t != null && Oo(e, 'checked', t, !1));
}
function Mi(e, t) {
	mu(e, t);
	var n = St(t.value),
		r = t.type;
	if (n != null)
		r === 'number'
			? ((n === 0 && e.value === '') || e.value != n) && (e.value = '' + n)
			: e.value !== '' + n && (e.value = '' + n);
	else if (r === 'submit' || r === 'reset') {
		e.removeAttribute('value');
		return;
	}
	(t.hasOwnProperty('value')
		? Ri(e, t.type, n)
		: t.hasOwnProperty('defaultValue') && Ri(e, t.type, St(t.defaultValue)),
		t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked));
}
function za(e, t, n) {
	if (t.hasOwnProperty('value') || t.hasOwnProperty('defaultValue')) {
		var r = t.type;
		if (!((r !== 'submit' && r !== 'reset') || (t.value !== void 0 && t.value !== null))) return;
		((t = '' + e._wrapperState.initialValue), n || t === e.value || (e.value = t), (e.defaultValue = t));
	}
	((n = e.name),
		n !== '' && (e.name = ''),
		(e.defaultChecked = !!e._wrapperState.initialChecked),
		n !== '' && (e.name = n));
}
function Ri(e, t, n) {
	(t !== 'number' || rl(e.ownerDocument) !== e) &&
		(n == null
			? (e.defaultValue = '' + e._wrapperState.initialValue)
			: e.defaultValue !== '' + n && (e.defaultValue = '' + n));
}
var Fn = Array.isArray;
function fn(e, t, n, r) {
	if (((e = e.options), t)) {
		t = {};
		for (var l = 0; l < n.length; l++) t['$' + n[l]] = !0;
		for (n = 0; n < e.length; n++)
			((l = t.hasOwnProperty('$' + e[n].value)),
				e[n].selected !== l && (e[n].selected = l),
				l && r && (e[n].defaultSelected = !0));
	} else {
		for (n = '' + St(n), t = null, l = 0; l < e.length; l++) {
			if (e[l].value === n) {
				((e[l].selected = !0), r && (e[l].defaultSelected = !0));
				return;
			}
			t !== null || e[l].disabled || (t = e[l]);
		}
		t !== null && (t.selected = !0);
	}
}
function ji(e, t) {
	if (t.dangerouslySetInnerHTML != null) throw Error(S(91));
	return Q({}, t, { value: void 0, defaultValue: void 0, children: '' + e._wrapperState.initialValue });
}
function Oa(e, t) {
	var n = t.value;
	if (n == null) {
		if (((n = t.children), (t = t.defaultValue), n != null)) {
			if (t != null) throw Error(S(92));
			if (Fn(n)) {
				if (1 < n.length) throw Error(S(93));
				n = n[0];
			}
			t = n;
		}
		(t == null && (t = ''), (n = t));
	}
	e._wrapperState = { initialValue: St(n) };
}
function hu(e, t) {
	var n = St(t.value),
		r = St(t.defaultValue);
	(n != null &&
		((n = '' + n),
		n !== e.value && (e.value = n),
		t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
		r != null && (e.defaultValue = '' + r));
}
function Ma(e) {
	var t = e.textContent;
	t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
}
function vu(e) {
	switch (e) {
		case 'svg':
			return 'http://www.w3.org/2000/svg';
		case 'math':
			return 'http://www.w3.org/1998/Math/MathML';
		default:
			return 'http://www.w3.org/1999/xhtml';
	}
}
function Di(e, t) {
	return e == null || e === 'http://www.w3.org/1999/xhtml'
		? vu(t)
		: e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
			? 'http://www.w3.org/1999/xhtml'
			: e;
}
var Pr,
	gu = (function (e) {
		return typeof MSApp < 'u' && MSApp.execUnsafeLocalFunction
			? function (t, n, r, l) {
					MSApp.execUnsafeLocalFunction(function () {
						return e(t, n, r, l);
					});
				}
			: e;
	})(function (e, t) {
		if (e.namespaceURI !== 'http://www.w3.org/2000/svg' || 'innerHTML' in e) e.innerHTML = t;
		else {
			for (
				Pr = Pr || document.createElement('div'),
					Pr.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>',
					t = Pr.firstChild;
				e.firstChild;

			)
				e.removeChild(e.firstChild);
			for (; t.firstChild; ) e.appendChild(t.firstChild);
		}
	});
function Zn(e, t) {
	if (t) {
		var n = e.firstChild;
		if (n && n === e.lastChild && n.nodeType === 3) {
			n.nodeValue = t;
			return;
		}
	}
	e.textContent = t;
}
var Un = {
		animationIterationCount: !0,
		aspectRatio: !0,
		borderImageOutset: !0,
		borderImageSlice: !0,
		borderImageWidth: !0,
		boxFlex: !0,
		boxFlexGroup: !0,
		boxOrdinalGroup: !0,
		columnCount: !0,
		columns: !0,
		flex: !0,
		flexGrow: !0,
		flexPositive: !0,
		flexShrink: !0,
		flexNegative: !0,
		flexOrder: !0,
		gridArea: !0,
		gridRow: !0,
		gridRowEnd: !0,
		gridRowSpan: !0,
		gridRowStart: !0,
		gridColumn: !0,
		gridColumnEnd: !0,
		gridColumnSpan: !0,
		gridColumnStart: !0,
		fontWeight: !0,
		lineClamp: !0,
		lineHeight: !0,
		opacity: !0,
		order: !0,
		orphans: !0,
		tabSize: !0,
		widows: !0,
		zIndex: !0,
		zoom: !0,
		fillOpacity: !0,
		floodOpacity: !0,
		stopOpacity: !0,
		strokeDasharray: !0,
		strokeDashoffset: !0,
		strokeMiterlimit: !0,
		strokeOpacity: !0,
		strokeWidth: !0,
	},
	ad = ['Webkit', 'ms', 'Moz', 'O'];
Object.keys(Un).forEach(function (e) {
	ad.forEach(function (t) {
		((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Un[t] = Un[e]));
	});
});
function yu(e, t, n) {
	return t == null || typeof t == 'boolean' || t === ''
		? ''
		: n || typeof t != 'number' || t === 0 || (Un.hasOwnProperty(e) && Un[e])
			? ('' + t).trim()
			: t + 'px';
}
function wu(e, t) {
	e = e.style;
	for (var n in t)
		if (t.hasOwnProperty(n)) {
			var r = n.indexOf('--') === 0,
				l = yu(n, t[n], r);
			(n === 'float' && (n = 'cssFloat'), r ? e.setProperty(n, l) : (e[n] = l));
		}
}
var sd = Q(
	{ menuitem: !0 },
	{
		area: !0,
		base: !0,
		br: !0,
		col: !0,
		embed: !0,
		hr: !0,
		img: !0,
		input: !0,
		keygen: !0,
		link: !0,
		meta: !0,
		param: !0,
		source: !0,
		track: !0,
		wbr: !0,
	},
);
function Fi(e, t) {
	if (t) {
		if (sd[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(S(137, e));
		if (t.dangerouslySetInnerHTML != null) {
			if (t.children != null) throw Error(S(60));
			if (typeof t.dangerouslySetInnerHTML != 'object' || !('__html' in t.dangerouslySetInnerHTML))
				throw Error(S(61));
		}
		if (t.style != null && typeof t.style != 'object') throw Error(S(62));
	}
}
function Ii(e, t) {
	if (e.indexOf('-') === -1) return typeof t.is == 'string';
	switch (e) {
		case 'annotation-xml':
		case 'color-profile':
		case 'font-face':
		case 'font-face-src':
		case 'font-face-uri':
		case 'font-face-format':
		case 'font-face-name':
		case 'missing-glyph':
			return !1;
		default:
			return !0;
	}
}
var $i = null;
function Do(e) {
	return (
		(e = e.target || e.srcElement || window),
		e.correspondingUseElement && (e = e.correspondingUseElement),
		e.nodeType === 3 ? e.parentNode : e
	);
}
var Ai = null,
	dn = null,
	pn = null;
function Ra(e) {
	if ((e = yr(e))) {
		if (typeof Ai != 'function') throw Error(S(280));
		var t = e.stateNode;
		t && ((t = Rl(t)), Ai(e.stateNode, e.type, t));
	}
}
function xu(e) {
	dn ? (pn ? pn.push(e) : (pn = [e])) : (dn = e);
}
function ku() {
	if (dn) {
		var e = dn,
			t = pn;
		if (((pn = dn = null), Ra(e), t)) for (e = 0; e < t.length; e++) Ra(t[e]);
	}
}
function Su(e, t) {
	return e(t);
}
function Eu() {}
var Jl = !1;
function Cu(e, t, n) {
	if (Jl) return e(t, n);
	Jl = !0;
	try {
		return Su(e, t, n);
	} finally {
		((Jl = !1), (dn !== null || pn !== null) && (Eu(), ku()));
	}
}
function Jn(e, t) {
	var n = e.stateNode;
	if (n === null) return null;
	var r = Rl(n);
	if (r === null) return null;
	n = r[t];
	e: switch (t) {
		case 'onClick':
		case 'onClickCapture':
		case 'onDoubleClick':
		case 'onDoubleClickCapture':
		case 'onMouseDown':
		case 'onMouseDownCapture':
		case 'onMouseMove':
		case 'onMouseMoveCapture':
		case 'onMouseUp':
		case 'onMouseUpCapture':
		case 'onMouseEnter':
			((r = !r.disabled) ||
				((e = e.type), (r = !(e === 'button' || e === 'input' || e === 'select' || e === 'textarea'))),
				(e = !r));
			break e;
		default:
			e = !1;
	}
	if (e) return null;
	if (n && typeof n != 'function') throw Error(S(231, t, typeof n));
	return n;
}
var Ui = !1;
if (Je)
	try {
		var Tn = {};
		(Object.defineProperty(Tn, 'passive', {
			get: function () {
				Ui = !0;
			},
		}),
			window.addEventListener('test', Tn, Tn),
			window.removeEventListener('test', Tn, Tn));
	} catch {
		Ui = !1;
	}
function ud(e, t, n, r, l, i, o, a, s) {
	var u = Array.prototype.slice.call(arguments, 3);
	try {
		t.apply(n, u);
	} catch (m) {
		this.onError(m);
	}
}
var Bn = !1,
	ll = null,
	il = !1,
	Bi = null,
	cd = {
		onError: function (e) {
			((Bn = !0), (ll = e));
		},
	};
function fd(e, t, n, r, l, i, o, a, s) {
	((Bn = !1), (ll = null), ud.apply(cd, arguments));
}
function dd(e, t, n, r, l, i, o, a, s) {
	if ((fd.apply(this, arguments), Bn)) {
		if (Bn) {
			var u = ll;
			((Bn = !1), (ll = null));
		} else throw Error(S(198));
		il || ((il = !0), (Bi = u));
	}
}
function Yt(e) {
	var t = e,
		n = e;
	if (e.alternate) for (; t.return; ) t = t.return;
	else {
		e = t;
		do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
		while (e);
	}
	return t.tag === 3 ? n : null;
}
function Nu(e) {
	if (e.tag === 13) {
		var t = e.memoizedState;
		if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null)) return t.dehydrated;
	}
	return null;
}
function ja(e) {
	if (Yt(e) !== e) throw Error(S(188));
}
function pd(e) {
	var t = e.alternate;
	if (!t) {
		if (((t = Yt(e)), t === null)) throw Error(S(188));
		return t !== e ? null : e;
	}
	for (var n = e, r = t; ; ) {
		var l = n.return;
		if (l === null) break;
		var i = l.alternate;
		if (i === null) {
			if (((r = l.return), r !== null)) {
				n = r;
				continue;
			}
			break;
		}
		if (l.child === i.child) {
			for (i = l.child; i; ) {
				if (i === n) return (ja(l), e);
				if (i === r) return (ja(l), t);
				i = i.sibling;
			}
			throw Error(S(188));
		}
		if (n.return !== r.return) ((n = l), (r = i));
		else {
			for (var o = !1, a = l.child; a; ) {
				if (a === n) {
					((o = !0), (n = l), (r = i));
					break;
				}
				if (a === r) {
					((o = !0), (r = l), (n = i));
					break;
				}
				a = a.sibling;
			}
			if (!o) {
				for (a = i.child; a; ) {
					if (a === n) {
						((o = !0), (n = i), (r = l));
						break;
					}
					if (a === r) {
						((o = !0), (r = i), (n = l));
						break;
					}
					a = a.sibling;
				}
				if (!o) throw Error(S(189));
			}
		}
		if (n.alternate !== r) throw Error(S(190));
	}
	if (n.tag !== 3) throw Error(S(188));
	return n.stateNode.current === n ? e : t;
}
function _u(e) {
	return ((e = pd(e)), e !== null ? Pu(e) : null);
}
function Pu(e) {
	if (e.tag === 5 || e.tag === 6) return e;
	for (e = e.child; e !== null; ) {
		var t = Pu(e);
		if (t !== null) return t;
		e = e.sibling;
	}
	return null;
}
var Tu = ke.unstable_scheduleCallback,
	Da = ke.unstable_cancelCallback,
	md = ke.unstable_shouldYield,
	hd = ke.unstable_requestPaint,
	X = ke.unstable_now,
	vd = ke.unstable_getCurrentPriorityLevel,
	Fo = ke.unstable_ImmediatePriority,
	Lu = ke.unstable_UserBlockingPriority,
	ol = ke.unstable_NormalPriority,
	gd = ke.unstable_LowPriority,
	zu = ke.unstable_IdlePriority,
	Ll = null,
	We = null;
function yd(e) {
	if (We && typeof We.onCommitFiberRoot == 'function')
		try {
			We.onCommitFiberRoot(Ll, e, void 0, (e.current.flags & 128) === 128);
		} catch {}
}
var De = Math.clz32 ? Math.clz32 : kd,
	wd = Math.log,
	xd = Math.LN2;
function kd(e) {
	return ((e >>>= 0), e === 0 ? 32 : (31 - ((wd(e) / xd) | 0)) | 0);
}
var Tr = 64,
	Lr = 4194304;
function In(e) {
	switch (e & -e) {
		case 1:
			return 1;
		case 2:
			return 2;
		case 4:
			return 4;
		case 8:
			return 8;
		case 16:
			return 16;
		case 32:
			return 32;
		case 64:
		case 128:
		case 256:
		case 512:
		case 1024:
		case 2048:
		case 4096:
		case 8192:
		case 16384:
		case 32768:
		case 65536:
		case 131072:
		case 262144:
		case 524288:
		case 1048576:
		case 2097152:
			return e & 4194240;
		case 4194304:
		case 8388608:
		case 16777216:
		case 33554432:
		case 67108864:
			return e & 130023424;
		case 134217728:
			return 134217728;
		case 268435456:
			return 268435456;
		case 536870912:
			return 536870912;
		case 1073741824:
			return 1073741824;
		default:
			return e;
	}
}
function al(e, t) {
	var n = e.pendingLanes;
	if (n === 0) return 0;
	var r = 0,
		l = e.suspendedLanes,
		i = e.pingedLanes,
		o = n & 268435455;
	if (o !== 0) {
		var a = o & ~l;
		a !== 0 ? (r = In(a)) : ((i &= o), i !== 0 && (r = In(i)));
	} else ((o = n & ~l), o !== 0 ? (r = In(o)) : i !== 0 && (r = In(i)));
	if (r === 0) return 0;
	if (t !== 0 && t !== r && !(t & l) && ((l = r & -r), (i = t & -t), l >= i || (l === 16 && (i & 4194240) !== 0)))
		return t;
	if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
		for (e = e.entanglements, t &= r; 0 < t; ) ((n = 31 - De(t)), (l = 1 << n), (r |= e[n]), (t &= ~l));
	return r;
}
function Sd(e, t) {
	switch (e) {
		case 1:
		case 2:
		case 4:
			return t + 250;
		case 8:
		case 16:
		case 32:
		case 64:
		case 128:
		case 256:
		case 512:
		case 1024:
		case 2048:
		case 4096:
		case 8192:
		case 16384:
		case 32768:
		case 65536:
		case 131072:
		case 262144:
		case 524288:
		case 1048576:
		case 2097152:
			return t + 5e3;
		case 4194304:
		case 8388608:
		case 16777216:
		case 33554432:
		case 67108864:
			return -1;
		case 134217728:
		case 268435456:
		case 536870912:
		case 1073741824:
			return -1;
		default:
			return -1;
	}
}
function Ed(e, t) {
	for (var n = e.suspendedLanes, r = e.pingedLanes, l = e.expirationTimes, i = e.pendingLanes; 0 < i; ) {
		var o = 31 - De(i),
			a = 1 << o,
			s = l[o];
		(s === -1 ? (!(a & n) || a & r) && (l[o] = Sd(a, t)) : s <= t && (e.expiredLanes |= a), (i &= ~a));
	}
}
function Wi(e) {
	return ((e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0);
}
function Ou() {
	var e = Tr;
	return ((Tr <<= 1), !(Tr & 4194240) && (Tr = 64), e);
}
function bl(e) {
	for (var t = [], n = 0; 31 > n; n++) t.push(e);
	return t;
}
function vr(e, t, n) {
	((e.pendingLanes |= t),
		t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
		(e = e.eventTimes),
		(t = 31 - De(t)),
		(e[t] = n));
}
function Cd(e, t) {
	var n = e.pendingLanes & ~t;
	((e.pendingLanes = t),
		(e.suspendedLanes = 0),
		(e.pingedLanes = 0),
		(e.expiredLanes &= t),
		(e.mutableReadLanes &= t),
		(e.entangledLanes &= t),
		(t = e.entanglements));
	var r = e.eventTimes;
	for (e = e.expirationTimes; 0 < n; ) {
		var l = 31 - De(n),
			i = 1 << l;
		((t[l] = 0), (r[l] = -1), (e[l] = -1), (n &= ~i));
	}
}
function Io(e, t) {
	var n = (e.entangledLanes |= t);
	for (e = e.entanglements; n; ) {
		var r = 31 - De(n),
			l = 1 << r;
		((l & t) | (e[r] & t) && (e[r] |= t), (n &= ~l));
	}
}
var I = 0;
function Mu(e) {
	return ((e &= -e), 1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1);
}
var Ru,
	$o,
	ju,
	Du,
	Fu,
	Hi = !1,
	zr = [],
	dt = null,
	pt = null,
	mt = null,
	bn = new Map(),
	er = new Map(),
	at = [],
	Nd =
		'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
			' ',
		);
function Fa(e, t) {
	switch (e) {
		case 'focusin':
		case 'focusout':
			dt = null;
			break;
		case 'dragenter':
		case 'dragleave':
			pt = null;
			break;
		case 'mouseover':
		case 'mouseout':
			mt = null;
			break;
		case 'pointerover':
		case 'pointerout':
			bn.delete(t.pointerId);
			break;
		case 'gotpointercapture':
		case 'lostpointercapture':
			er.delete(t.pointerId);
	}
}
function Ln(e, t, n, r, l, i) {
	return e === null || e.nativeEvent !== i
		? ((e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: i, targetContainers: [l] }),
			t !== null && ((t = yr(t)), t !== null && $o(t)),
			e)
		: ((e.eventSystemFlags |= r), (t = e.targetContainers), l !== null && t.indexOf(l) === -1 && t.push(l), e);
}
function _d(e, t, n, r, l) {
	switch (t) {
		case 'focusin':
			return ((dt = Ln(dt, e, t, n, r, l)), !0);
		case 'dragenter':
			return ((pt = Ln(pt, e, t, n, r, l)), !0);
		case 'mouseover':
			return ((mt = Ln(mt, e, t, n, r, l)), !0);
		case 'pointerover':
			var i = l.pointerId;
			return (bn.set(i, Ln(bn.get(i) || null, e, t, n, r, l)), !0);
		case 'gotpointercapture':
			return ((i = l.pointerId), er.set(i, Ln(er.get(i) || null, e, t, n, r, l)), !0);
	}
	return !1;
}
function Iu(e) {
	var t = Dt(e.target);
	if (t !== null) {
		var n = Yt(t);
		if (n !== null) {
			if (((t = n.tag), t === 13)) {
				if (((t = Nu(n)), t !== null)) {
					((e.blockedOn = t),
						Fu(e.priority, function () {
							ju(n);
						}));
					return;
				}
			} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
				e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
				return;
			}
		}
	}
	e.blockedOn = null;
}
function Qr(e) {
	if (e.blockedOn !== null) return !1;
	for (var t = e.targetContainers; 0 < t.length; ) {
		var n = Vi(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
		if (n === null) {
			n = e.nativeEvent;
			var r = new n.constructor(n.type, n);
			(($i = r), n.target.dispatchEvent(r), ($i = null));
		} else return ((t = yr(n)), t !== null && $o(t), (e.blockedOn = n), !1);
		t.shift();
	}
	return !0;
}
function Ia(e, t, n) {
	Qr(e) && n.delete(t);
}
function Pd() {
	((Hi = !1),
		dt !== null && Qr(dt) && (dt = null),
		pt !== null && Qr(pt) && (pt = null),
		mt !== null && Qr(mt) && (mt = null),
		bn.forEach(Ia),
		er.forEach(Ia));
}
function zn(e, t) {
	e.blockedOn === t &&
		((e.blockedOn = null), Hi || ((Hi = !0), ke.unstable_scheduleCallback(ke.unstable_NormalPriority, Pd)));
}
function tr(e) {
	function t(l) {
		return zn(l, e);
	}
	if (0 < zr.length) {
		zn(zr[0], e);
		for (var n = 1; n < zr.length; n++) {
			var r = zr[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
	}
	for (
		dt !== null && zn(dt, e),
			pt !== null && zn(pt, e),
			mt !== null && zn(mt, e),
			bn.forEach(t),
			er.forEach(t),
			n = 0;
		n < at.length;
		n++
	)
		((r = at[n]), r.blockedOn === e && (r.blockedOn = null));
	for (; 0 < at.length && ((n = at[0]), n.blockedOn === null); ) (Iu(n), n.blockedOn === null && at.shift());
}
var mn = nt.ReactCurrentBatchConfig,
	sl = !0;
function Td(e, t, n, r) {
	var l = I,
		i = mn.transition;
	mn.transition = null;
	try {
		((I = 1), Ao(e, t, n, r));
	} finally {
		((I = l), (mn.transition = i));
	}
}
function Ld(e, t, n, r) {
	var l = I,
		i = mn.transition;
	mn.transition = null;
	try {
		((I = 4), Ao(e, t, n, r));
	} finally {
		((I = l), (mn.transition = i));
	}
}
function Ao(e, t, n, r) {
	if (sl) {
		var l = Vi(e, t, n, r);
		if (l === null) (ui(e, t, r, ul, n), Fa(e, r));
		else if (_d(l, e, t, n, r)) r.stopPropagation();
		else if ((Fa(e, r), t & 4 && -1 < Nd.indexOf(e))) {
			for (; l !== null; ) {
				var i = yr(l);
				if ((i !== null && Ru(i), (i = Vi(e, t, n, r)), i === null && ui(e, t, r, ul, n), i === l)) break;
				l = i;
			}
			l !== null && r.stopPropagation();
		} else ui(e, t, r, null, n);
	}
}
var ul = null;
function Vi(e, t, n, r) {
	if (((ul = null), (e = Do(r)), (e = Dt(e)), e !== null))
		if (((t = Yt(e)), t === null)) e = null;
		else if (((n = t.tag), n === 13)) {
			if (((e = Nu(t)), e !== null)) return e;
			e = null;
		} else if (n === 3) {
			if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
			e = null;
		} else t !== e && (e = null);
	return ((ul = e), null);
}
function $u(e) {
	switch (e) {
		case 'cancel':
		case 'click':
		case 'close':
		case 'contextmenu':
		case 'copy':
		case 'cut':
		case 'auxclick':
		case 'dblclick':
		case 'dragend':
		case 'dragstart':
		case 'drop':
		case 'focusin':
		case 'focusout':
		case 'input':
		case 'invalid':
		case 'keydown':
		case 'keypress':
		case 'keyup':
		case 'mousedown':
		case 'mouseup':
		case 'paste':
		case 'pause':
		case 'play':
		case 'pointercancel':
		case 'pointerdown':
		case 'pointerup':
		case 'ratechange':
		case 'reset':
		case 'resize':
		case 'seeked':
		case 'submit':
		case 'touchcancel':
		case 'touchend':
		case 'touchstart':
		case 'volumechange':
		case 'change':
		case 'selectionchange':
		case 'textInput':
		case 'compositionstart':
		case 'compositionend':
		case 'compositionupdate':
		case 'beforeblur':
		case 'afterblur':
		case 'beforeinput':
		case 'blur':
		case 'fullscreenchange':
		case 'focus':
		case 'hashchange':
		case 'popstate':
		case 'select':
		case 'selectstart':
			return 1;
		case 'drag':
		case 'dragenter':
		case 'dragexit':
		case 'dragleave':
		case 'dragover':
		case 'mousemove':
		case 'mouseout':
		case 'mouseover':
		case 'pointermove':
		case 'pointerout':
		case 'pointerover':
		case 'scroll':
		case 'toggle':
		case 'touchmove':
		case 'wheel':
		case 'mouseenter':
		case 'mouseleave':
		case 'pointerenter':
		case 'pointerleave':
			return 4;
		case 'message':
			switch (vd()) {
				case Fo:
					return 1;
				case Lu:
					return 4;
				case ol:
				case gd:
					return 16;
				case zu:
					return 536870912;
				default:
					return 16;
			}
		default:
			return 16;
	}
}
var ct = null,
	Uo = null,
	Kr = null;
function Au() {
	if (Kr) return Kr;
	var e,
		t = Uo,
		n = t.length,
		r,
		l = 'value' in ct ? ct.value : ct.textContent,
		i = l.length;
	for (e = 0; e < n && t[e] === l[e]; e++);
	var o = n - e;
	for (r = 1; r <= o && t[n - r] === l[i - r]; r++);
	return (Kr = l.slice(e, 1 < r ? 1 - r : void 0));
}
function Yr(e) {
	var t = e.keyCode;
	return (
		'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
		e === 10 && (e = 13),
		32 <= e || e === 13 ? e : 0
	);
}
function Or() {
	return !0;
}
function $a() {
	return !1;
}
function Ee(e) {
	function t(n, r, l, i, o) {
		((this._reactName = n),
			(this._targetInst = l),
			(this.type = r),
			(this.nativeEvent = i),
			(this.target = o),
			(this.currentTarget = null));
		for (var a in e) e.hasOwnProperty(a) && ((n = e[a]), (this[a] = n ? n(i) : i[a]));
		return (
			(this.isDefaultPrevented = (i.defaultPrevented != null ? i.defaultPrevented : i.returnValue === !1)
				? Or
				: $a),
			(this.isPropagationStopped = $a),
			this
		);
	}
	return (
		Q(t.prototype, {
			preventDefault: function () {
				this.defaultPrevented = !0;
				var n = this.nativeEvent;
				n &&
					(n.preventDefault ? n.preventDefault() : typeof n.returnValue != 'unknown' && (n.returnValue = !1),
					(this.isDefaultPrevented = Or));
			},
			stopPropagation: function () {
				var n = this.nativeEvent;
				n &&
					(n.stopPropagation
						? n.stopPropagation()
						: typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
					(this.isPropagationStopped = Or));
			},
			persist: function () {},
			isPersistent: Or,
		}),
		t
	);
}
var Nn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function (e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0,
	},
	Bo = Ee(Nn),
	gr = Q({}, Nn, { view: 0, detail: 0 }),
	zd = Ee(gr),
	ei,
	ti,
	On,
	zl = Q({}, gr, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Wo,
		button: 0,
		buttons: 0,
		relatedTarget: function (e) {
			return e.relatedTarget === void 0
				? e.fromElement === e.srcElement
					? e.toElement
					: e.fromElement
				: e.relatedTarget;
		},
		movementX: function (e) {
			return 'movementX' in e
				? e.movementX
				: (e !== On &&
						(On && e.type === 'mousemove'
							? ((ei = e.screenX - On.screenX), (ti = e.screenY - On.screenY))
							: (ti = ei = 0),
						(On = e)),
					ei);
		},
		movementY: function (e) {
			return 'movementY' in e ? e.movementY : ti;
		},
	}),
	Aa = Ee(zl),
	Od = Q({}, zl, { dataTransfer: 0 }),
	Md = Ee(Od),
	Rd = Q({}, gr, { relatedTarget: 0 }),
	ni = Ee(Rd),
	jd = Q({}, Nn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
	Dd = Ee(jd),
	Fd = Q({}, Nn, {
		clipboardData: function (e) {
			return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
		},
	}),
	Id = Ee(Fd),
	$d = Q({}, Nn, { data: 0 }),
	Ua = Ee($d),
	Ad = {
		Esc: 'Escape',
		Spacebar: ' ',
		Left: 'ArrowLeft',
		Up: 'ArrowUp',
		Right: 'ArrowRight',
		Down: 'ArrowDown',
		Del: 'Delete',
		Win: 'OS',
		Menu: 'ContextMenu',
		Apps: 'ContextMenu',
		Scroll: 'ScrollLock',
		MozPrintableKey: 'Unidentified',
	},
	Ud = {
		8: 'Backspace',
		9: 'Tab',
		12: 'Clear',
		13: 'Enter',
		16: 'Shift',
		17: 'Control',
		18: 'Alt',
		19: 'Pause',
		20: 'CapsLock',
		27: 'Escape',
		32: ' ',
		33: 'PageUp',
		34: 'PageDown',
		35: 'End',
		36: 'Home',
		37: 'ArrowLeft',
		38: 'ArrowUp',
		39: 'ArrowRight',
		40: 'ArrowDown',
		45: 'Insert',
		46: 'Delete',
		112: 'F1',
		113: 'F2',
		114: 'F3',
		115: 'F4',
		116: 'F5',
		117: 'F6',
		118: 'F7',
		119: 'F8',
		120: 'F9',
		121: 'F10',
		122: 'F11',
		123: 'F12',
		144: 'NumLock',
		145: 'ScrollLock',
		224: 'Meta',
	},
	Bd = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
function Wd(e) {
	var t = this.nativeEvent;
	return t.getModifierState ? t.getModifierState(e) : (e = Bd[e]) ? !!t[e] : !1;
}
function Wo() {
	return Wd;
}
var Hd = Q({}, gr, {
		key: function (e) {
			if (e.key) {
				var t = Ad[e.key] || e.key;
				if (t !== 'Unidentified') return t;
			}
			return e.type === 'keypress'
				? ((e = Yr(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
				: e.type === 'keydown' || e.type === 'keyup'
					? Ud[e.keyCode] || 'Unidentified'
					: '';
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Wo,
		charCode: function (e) {
			return e.type === 'keypress' ? Yr(e) : 0;
		},
		keyCode: function (e) {
			return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
		},
		which: function (e) {
			return e.type === 'keypress' ? Yr(e) : e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
		},
	}),
	Vd = Ee(Hd),
	Qd = Q({}, zl, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0,
	}),
	Ba = Ee(Qd),
	Kd = Q({}, gr, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Wo,
	}),
	Yd = Ee(Kd),
	Gd = Q({}, Nn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
	Xd = Ee(Gd),
	qd = Q({}, zl, {
		deltaX: function (e) {
			return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function (e) {
			return 'deltaY' in e
				? e.deltaY
				: 'wheelDeltaY' in e
					? -e.wheelDeltaY
					: 'wheelDelta' in e
						? -e.wheelDelta
						: 0;
		},
		deltaZ: 0,
		deltaMode: 0,
	}),
	Zd = Ee(qd),
	Jd = [9, 13, 27, 32],
	Ho = Je && 'CompositionEvent' in window,
	Wn = null;
Je && 'documentMode' in document && (Wn = document.documentMode);
var bd = Je && 'TextEvent' in window && !Wn,
	Uu = Je && (!Ho || (Wn && 8 < Wn && 11 >= Wn)),
	Wa = String.fromCharCode(32),
	Ha = !1;
function Bu(e, t) {
	switch (e) {
		case 'keyup':
			return Jd.indexOf(t.keyCode) !== -1;
		case 'keydown':
			return t.keyCode !== 229;
		case 'keypress':
		case 'mousedown':
		case 'focusout':
			return !0;
		default:
			return !1;
	}
}
function Wu(e) {
	return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null);
}
var en = !1;
function ep(e, t) {
	switch (e) {
		case 'compositionend':
			return Wu(t);
		case 'keypress':
			return t.which !== 32 ? null : ((Ha = !0), Wa);
		case 'textInput':
			return ((e = t.data), e === Wa && Ha ? null : e);
		default:
			return null;
	}
}
function tp(e, t) {
	if (en)
		return e === 'compositionend' || (!Ho && Bu(e, t)) ? ((e = Au()), (Kr = Uo = ct = null), (en = !1), e) : null;
	switch (e) {
		case 'paste':
			return null;
		case 'keypress':
			if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
				if (t.char && 1 < t.char.length) return t.char;
				if (t.which) return String.fromCharCode(t.which);
			}
			return null;
		case 'compositionend':
			return Uu && t.locale !== 'ko' ? null : t.data;
		default:
			return null;
	}
}
var np = {
	color: !0,
	date: !0,
	datetime: !0,
	'datetime-local': !0,
	email: !0,
	month: !0,
	number: !0,
	password: !0,
	range: !0,
	search: !0,
	tel: !0,
	text: !0,
	time: !0,
	url: !0,
	week: !0,
};
function Va(e) {
	var t = e && e.nodeName && e.nodeName.toLowerCase();
	return t === 'input' ? !!np[e.type] : t === 'textarea';
}
function Hu(e, t, n, r) {
	(xu(r),
		(t = cl(t, 'onChange')),
		0 < t.length && ((n = new Bo('onChange', 'change', null, n, r)), e.push({ event: n, listeners: t })));
}
var Hn = null,
	nr = null;
function rp(e) {
	ec(e, 0);
}
function Ol(e) {
	var t = rn(e);
	if (pu(t)) return e;
}
function lp(e, t) {
	if (e === 'change') return t;
}
var Vu = !1;
if (Je) {
	var ri;
	if (Je) {
		var li = 'oninput' in document;
		if (!li) {
			var Qa = document.createElement('div');
			(Qa.setAttribute('oninput', 'return;'), (li = typeof Qa.oninput == 'function'));
		}
		ri = li;
	} else ri = !1;
	Vu = ri && (!document.documentMode || 9 < document.documentMode);
}
function Ka() {
	Hn && (Hn.detachEvent('onpropertychange', Qu), (nr = Hn = null));
}
function Qu(e) {
	if (e.propertyName === 'value' && Ol(nr)) {
		var t = [];
		(Hu(t, nr, e, Do(e)), Cu(rp, t));
	}
}
function ip(e, t, n) {
	e === 'focusin' ? (Ka(), (Hn = t), (nr = n), Hn.attachEvent('onpropertychange', Qu)) : e === 'focusout' && Ka();
}
function op(e) {
	if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return Ol(nr);
}
function ap(e, t) {
	if (e === 'click') return Ol(t);
}
function sp(e, t) {
	if (e === 'input' || e === 'change') return Ol(t);
}
function up(e, t) {
	return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var Ie = typeof Object.is == 'function' ? Object.is : up;
function rr(e, t) {
	if (Ie(e, t)) return !0;
	if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
	var n = Object.keys(e),
		r = Object.keys(t);
	if (n.length !== r.length) return !1;
	for (r = 0; r < n.length; r++) {
		var l = n[r];
		if (!_i.call(t, l) || !Ie(e[l], t[l])) return !1;
	}
	return !0;
}
function Ya(e) {
	for (; e && e.firstChild; ) e = e.firstChild;
	return e;
}
function Ga(e, t) {
	var n = Ya(e);
	e = 0;
	for (var r; n; ) {
		if (n.nodeType === 3) {
			if (((r = e + n.textContent.length), e <= t && r >= t)) return { node: n, offset: t - e };
			e = r;
		}
		e: {
			for (; n; ) {
				if (n.nextSibling) {
					n = n.nextSibling;
					break e;
				}
				n = n.parentNode;
			}
			n = void 0;
		}
		n = Ya(n);
	}
}
function Ku(e, t) {
	return e && t
		? e === t
			? !0
			: e && e.nodeType === 3
				? !1
				: t && t.nodeType === 3
					? Ku(e, t.parentNode)
					: 'contains' in e
						? e.contains(t)
						: e.compareDocumentPosition
							? !!(e.compareDocumentPosition(t) & 16)
							: !1
		: !1;
}
function Yu() {
	for (var e = window, t = rl(); t instanceof e.HTMLIFrameElement; ) {
		try {
			var n = typeof t.contentWindow.location.href == 'string';
		} catch {
			n = !1;
		}
		if (n) e = t.contentWindow;
		else break;
		t = rl(e.document);
	}
	return t;
}
function Vo(e) {
	var t = e && e.nodeName && e.nodeName.toLowerCase();
	return (
		t &&
		((t === 'input' &&
			(e.type === 'text' ||
				e.type === 'search' ||
				e.type === 'tel' ||
				e.type === 'url' ||
				e.type === 'password')) ||
			t === 'textarea' ||
			e.contentEditable === 'true')
	);
}
function cp(e) {
	var t = Yu(),
		n = e.focusedElem,
		r = e.selectionRange;
	if (t !== n && n && n.ownerDocument && Ku(n.ownerDocument.documentElement, n)) {
		if (r !== null && Vo(n)) {
			if (((t = r.start), (e = r.end), e === void 0 && (e = t), 'selectionStart' in n))
				((n.selectionStart = t), (n.selectionEnd = Math.min(e, n.value.length)));
			else if (((e = ((t = n.ownerDocument || document) && t.defaultView) || window), e.getSelection)) {
				e = e.getSelection();
				var l = n.textContent.length,
					i = Math.min(r.start, l);
				((r = r.end === void 0 ? i : Math.min(r.end, l)),
					!e.extend && i > r && ((l = r), (r = i), (i = l)),
					(l = Ga(n, i)));
				var o = Ga(n, r);
				l &&
					o &&
					(e.rangeCount !== 1 ||
						e.anchorNode !== l.node ||
						e.anchorOffset !== l.offset ||
						e.focusNode !== o.node ||
						e.focusOffset !== o.offset) &&
					((t = t.createRange()),
					t.setStart(l.node, l.offset),
					e.removeAllRanges(),
					i > r ? (e.addRange(t), e.extend(o.node, o.offset)) : (t.setEnd(o.node, o.offset), e.addRange(t)));
			}
		}
		for (t = [], e = n; (e = e.parentNode); )
			e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
		for (typeof n.focus == 'function' && n.focus(), n = 0; n < t.length; n++)
			((e = t[n]), (e.element.scrollLeft = e.left), (e.element.scrollTop = e.top));
	}
}
var fp = Je && 'documentMode' in document && 11 >= document.documentMode,
	tn = null,
	Qi = null,
	Vn = null,
	Ki = !1;
function Xa(e, t, n) {
	var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
	Ki ||
		tn == null ||
		tn !== rl(r) ||
		((r = tn),
		'selectionStart' in r && Vo(r)
			? (r = { start: r.selectionStart, end: r.selectionEnd })
			: ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
				(r = {
					anchorNode: r.anchorNode,
					anchorOffset: r.anchorOffset,
					focusNode: r.focusNode,
					focusOffset: r.focusOffset,
				})),
		(Vn && rr(Vn, r)) ||
			((Vn = r),
			(r = cl(Qi, 'onSelect')),
			0 < r.length &&
				((t = new Bo('onSelect', 'select', null, t, n)), e.push({ event: t, listeners: r }), (t.target = tn))));
}
function Mr(e, t) {
	var n = {};
	return ((n[e.toLowerCase()] = t.toLowerCase()), (n['Webkit' + e] = 'webkit' + t), (n['Moz' + e] = 'moz' + t), n);
}
var nn = {
		animationend: Mr('Animation', 'AnimationEnd'),
		animationiteration: Mr('Animation', 'AnimationIteration'),
		animationstart: Mr('Animation', 'AnimationStart'),
		transitionend: Mr('Transition', 'TransitionEnd'),
	},
	ii = {},
	Gu = {};
Je &&
	((Gu = document.createElement('div').style),
	'AnimationEvent' in window ||
		(delete nn.animationend.animation, delete nn.animationiteration.animation, delete nn.animationstart.animation),
	'TransitionEvent' in window || delete nn.transitionend.transition);
function Ml(e) {
	if (ii[e]) return ii[e];
	if (!nn[e]) return e;
	var t = nn[e],
		n;
	for (n in t) if (t.hasOwnProperty(n) && n in Gu) return (ii[e] = t[n]);
	return e;
}
var Xu = Ml('animationend'),
	qu = Ml('animationiteration'),
	Zu = Ml('animationstart'),
	Ju = Ml('transitionend'),
	bu = new Map(),
	qa =
		'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
			' ',
		);
function Ct(e, t) {
	(bu.set(e, t), Kt(t, [e]));
}
for (var oi = 0; oi < qa.length; oi++) {
	var ai = qa[oi],
		dp = ai.toLowerCase(),
		pp = ai[0].toUpperCase() + ai.slice(1);
	Ct(dp, 'on' + pp);
}
Ct(Xu, 'onAnimationEnd');
Ct(qu, 'onAnimationIteration');
Ct(Zu, 'onAnimationStart');
Ct('dblclick', 'onDoubleClick');
Ct('focusin', 'onFocus');
Ct('focusout', 'onBlur');
Ct(Ju, 'onTransitionEnd');
gn('onMouseEnter', ['mouseout', 'mouseover']);
gn('onMouseLeave', ['mouseout', 'mouseover']);
gn('onPointerEnter', ['pointerout', 'pointerover']);
gn('onPointerLeave', ['pointerout', 'pointerover']);
Kt('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '));
Kt('onSelect', 'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(' '));
Kt('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']);
Kt('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '));
Kt('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '));
Kt('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '));
var $n =
		'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
			' ',
		),
	mp = new Set('cancel close invalid load scroll toggle'.split(' ').concat($n));
function Za(e, t, n) {
	var r = e.type || 'unknown-event';
	((e.currentTarget = n), dd(r, t, void 0, e), (e.currentTarget = null));
}
function ec(e, t) {
	t = (t & 4) !== 0;
	for (var n = 0; n < e.length; n++) {
		var r = e[n],
			l = r.event;
		r = r.listeners;
		e: {
			var i = void 0;
			if (t)
				for (var o = r.length - 1; 0 <= o; o--) {
					var a = r[o],
						s = a.instance,
						u = a.currentTarget;
					if (((a = a.listener), s !== i && l.isPropagationStopped())) break e;
					(Za(l, a, u), (i = s));
				}
			else
				for (o = 0; o < r.length; o++) {
					if (
						((a = r[o]),
						(s = a.instance),
						(u = a.currentTarget),
						(a = a.listener),
						s !== i && l.isPropagationStopped())
					)
						break e;
					(Za(l, a, u), (i = s));
				}
		}
	}
	if (il) throw ((e = Bi), (il = !1), (Bi = null), e);
}
function A(e, t) {
	var n = t[Zi];
	n === void 0 && (n = t[Zi] = new Set());
	var r = e + '__bubble';
	n.has(r) || (tc(t, e, 2, !1), n.add(r));
}
function si(e, t, n) {
	var r = 0;
	(t && (r |= 4), tc(n, e, r, t));
}
var Rr = '_reactListening' + Math.random().toString(36).slice(2);
function lr(e) {
	if (!e[Rr]) {
		((e[Rr] = !0),
			su.forEach(function (n) {
				n !== 'selectionchange' && (mp.has(n) || si(n, !1, e), si(n, !0, e));
			}));
		var t = e.nodeType === 9 ? e : e.ownerDocument;
		t === null || t[Rr] || ((t[Rr] = !0), si('selectionchange', !1, t));
	}
}
function tc(e, t, n, r) {
	switch ($u(t)) {
		case 1:
			var l = Td;
			break;
		case 4:
			l = Ld;
			break;
		default:
			l = Ao;
	}
	((n = l.bind(null, t, n, e)),
		(l = void 0),
		!Ui || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (l = !0),
		r
			? l !== void 0
				? e.addEventListener(t, n, { capture: !0, passive: l })
				: e.addEventListener(t, n, !0)
			: l !== void 0
				? e.addEventListener(t, n, { passive: l })
				: e.addEventListener(t, n, !1));
}
function ui(e, t, n, r, l) {
	var i = r;
	if (!(t & 1) && !(t & 2) && r !== null)
		e: for (;;) {
			if (r === null) return;
			var o = r.tag;
			if (o === 3 || o === 4) {
				var a = r.stateNode.containerInfo;
				if (a === l || (a.nodeType === 8 && a.parentNode === l)) break;
				if (o === 4)
					for (o = r.return; o !== null; ) {
						var s = o.tag;
						if (
							(s === 3 || s === 4) &&
							((s = o.stateNode.containerInfo), s === l || (s.nodeType === 8 && s.parentNode === l))
						)
							return;
						o = o.return;
					}
				for (; a !== null; ) {
					if (((o = Dt(a)), o === null)) return;
					if (((s = o.tag), s === 5 || s === 6)) {
						r = i = o;
						continue e;
					}
					a = a.parentNode;
				}
			}
			r = r.return;
		}
	Cu(function () {
		var u = i,
			m = Do(n),
			v = [];
		e: {
			var h = bu.get(e);
			if (h !== void 0) {
				var w = Bo,
					C = e;
				switch (e) {
					case 'keypress':
						if (Yr(n) === 0) break e;
					case 'keydown':
					case 'keyup':
						w = Vd;
						break;
					case 'focusin':
						((C = 'focus'), (w = ni));
						break;
					case 'focusout':
						((C = 'blur'), (w = ni));
						break;
					case 'beforeblur':
					case 'afterblur':
						w = ni;
						break;
					case 'click':
						if (n.button === 2) break e;
					case 'auxclick':
					case 'dblclick':
					case 'mousedown':
					case 'mousemove':
					case 'mouseup':
					case 'mouseout':
					case 'mouseover':
					case 'contextmenu':
						w = Aa;
						break;
					case 'drag':
					case 'dragend':
					case 'dragenter':
					case 'dragexit':
					case 'dragleave':
					case 'dragover':
					case 'dragstart':
					case 'drop':
						w = Md;
						break;
					case 'touchcancel':
					case 'touchend':
					case 'touchmove':
					case 'touchstart':
						w = Yd;
						break;
					case Xu:
					case qu:
					case Zu:
						w = Dd;
						break;
					case Ju:
						w = Xd;
						break;
					case 'scroll':
						w = zd;
						break;
					case 'wheel':
						w = Zd;
						break;
					case 'copy':
					case 'cut':
					case 'paste':
						w = Id;
						break;
					case 'gotpointercapture':
					case 'lostpointercapture':
					case 'pointercancel':
					case 'pointerdown':
					case 'pointermove':
					case 'pointerout':
					case 'pointerover':
					case 'pointerup':
						w = Ba;
				}
				var N = (t & 4) !== 0,
					j = !N && e === 'scroll',
					f = N ? (h !== null ? h + 'Capture' : null) : h;
				N = [];
				for (var c = u, p; c !== null; ) {
					p = c;
					var y = p.stateNode;
					if (
						(p.tag === 5 &&
							y !== null &&
							((p = y), f !== null && ((y = Jn(c, f)), y != null && N.push(ir(c, y, p)))),
						j)
					)
						break;
					c = c.return;
				}
				0 < N.length && ((h = new w(h, C, null, n, m)), v.push({ event: h, listeners: N }));
			}
		}
		if (!(t & 7)) {
			e: {
				if (
					((h = e === 'mouseover' || e === 'pointerover'),
					(w = e === 'mouseout' || e === 'pointerout'),
					h && n !== $i && (C = n.relatedTarget || n.fromElement) && (Dt(C) || C[be]))
				)
					break e;
				if (
					(w || h) &&
					((h = m.window === m ? m : (h = m.ownerDocument) ? h.defaultView || h.parentWindow : window),
					w
						? ((C = n.relatedTarget || n.toElement),
							(w = u),
							(C = C ? Dt(C) : null),
							C !== null && ((j = Yt(C)), C !== j || (C.tag !== 5 && C.tag !== 6)) && (C = null))
						: ((w = null), (C = u)),
					w !== C)
				) {
					if (
						((N = Aa),
						(y = 'onMouseLeave'),
						(f = 'onMouseEnter'),
						(c = 'mouse'),
						(e === 'pointerout' || e === 'pointerover') &&
							((N = Ba), (y = 'onPointerLeave'), (f = 'onPointerEnter'), (c = 'pointer')),
						(j = w == null ? h : rn(w)),
						(p = C == null ? h : rn(C)),
						(h = new N(y, c + 'leave', w, n, m)),
						(h.target = j),
						(h.relatedTarget = p),
						(y = null),
						Dt(m) === u &&
							((N = new N(f, c + 'enter', C, n, m)), (N.target = p), (N.relatedTarget = j), (y = N)),
						(j = y),
						w && C)
					)
						t: {
							for (N = w, f = C, c = 0, p = N; p; p = Xt(p)) c++;
							for (p = 0, y = f; y; y = Xt(y)) p++;
							for (; 0 < c - p; ) ((N = Xt(N)), c--);
							for (; 0 < p - c; ) ((f = Xt(f)), p--);
							for (; c--; ) {
								if (N === f || (f !== null && N === f.alternate)) break t;
								((N = Xt(N)), (f = Xt(f)));
							}
							N = null;
						}
					else N = null;
					(w !== null && Ja(v, h, w, N, !1), C !== null && j !== null && Ja(v, j, C, N, !0));
				}
			}
			e: {
				if (
					((h = u ? rn(u) : window),
					(w = h.nodeName && h.nodeName.toLowerCase()),
					w === 'select' || (w === 'input' && h.type === 'file'))
				)
					var E = lp;
				else if (Va(h))
					if (Vu) E = sp;
					else {
						E = op;
						var x = ip;
					}
				else
					(w = h.nodeName) &&
						w.toLowerCase() === 'input' &&
						(h.type === 'checkbox' || h.type === 'radio') &&
						(E = ap);
				if (E && (E = E(e, u))) {
					Hu(v, E, n, m);
					break e;
				}
				(x && x(e, h, u),
					e === 'focusout' &&
						(x = h._wrapperState) &&
						x.controlled &&
						h.type === 'number' &&
						Ri(h, 'number', h.value));
			}
			switch (((x = u ? rn(u) : window), e)) {
				case 'focusin':
					(Va(x) || x.contentEditable === 'true') && ((tn = x), (Qi = u), (Vn = null));
					break;
				case 'focusout':
					Vn = Qi = tn = null;
					break;
				case 'mousedown':
					Ki = !0;
					break;
				case 'contextmenu':
				case 'mouseup':
				case 'dragend':
					((Ki = !1), Xa(v, n, m));
					break;
				case 'selectionchange':
					if (fp) break;
				case 'keydown':
				case 'keyup':
					Xa(v, n, m);
			}
			var g;
			if (Ho)
				e: {
					switch (e) {
						case 'compositionstart':
							var k = 'onCompositionStart';
							break e;
						case 'compositionend':
							k = 'onCompositionEnd';
							break e;
						case 'compositionupdate':
							k = 'onCompositionUpdate';
							break e;
					}
					k = void 0;
				}
			else
				en
					? Bu(e, n) && (k = 'onCompositionEnd')
					: e === 'keydown' && n.keyCode === 229 && (k = 'onCompositionStart');
			(k &&
				(Uu &&
					n.locale !== 'ko' &&
					(en || k !== 'onCompositionStart'
						? k === 'onCompositionEnd' && en && (g = Au())
						: ((ct = m), (Uo = 'value' in ct ? ct.value : ct.textContent), (en = !0))),
				(x = cl(u, k)),
				0 < x.length &&
					((k = new Ua(k, e, null, n, m)),
					v.push({ event: k, listeners: x }),
					g ? (k.data = g) : ((g = Wu(n)), g !== null && (k.data = g)))),
				(g = bd ? ep(e, n) : tp(e, n)) &&
					((u = cl(u, 'onBeforeInput')),
					0 < u.length &&
						((m = new Ua('onBeforeInput', 'beforeinput', null, n, m)),
						v.push({ event: m, listeners: u }),
						(m.data = g))));
		}
		ec(v, t);
	});
}
function ir(e, t, n) {
	return { instance: e, listener: t, currentTarget: n };
}
function cl(e, t) {
	for (var n = t + 'Capture', r = []; e !== null; ) {
		var l = e,
			i = l.stateNode;
		(l.tag === 5 &&
			i !== null &&
			((l = i),
			(i = Jn(e, n)),
			i != null && r.unshift(ir(e, i, l)),
			(i = Jn(e, t)),
			i != null && r.push(ir(e, i, l))),
			(e = e.return));
	}
	return r;
}
function Xt(e) {
	if (e === null) return null;
	do e = e.return;
	while (e && e.tag !== 5);
	return e || null;
}
function Ja(e, t, n, r, l) {
	for (var i = t._reactName, o = []; n !== null && n !== r; ) {
		var a = n,
			s = a.alternate,
			u = a.stateNode;
		if (s !== null && s === r) break;
		(a.tag === 5 &&
			u !== null &&
			((a = u),
			l
				? ((s = Jn(n, i)), s != null && o.unshift(ir(n, s, a)))
				: l || ((s = Jn(n, i)), s != null && o.push(ir(n, s, a)))),
			(n = n.return));
	}
	o.length !== 0 && e.push({ event: t, listeners: o });
}
var hp = /\r\n?/g,
	vp = /\u0000|\uFFFD/g;
function ba(e) {
	return (typeof e == 'string' ? e : '' + e)
		.replace(
			hp,
			`
`,
		)
		.replace(vp, '');
}
function jr(e, t, n) {
	if (((t = ba(t)), ba(e) !== t && n)) throw Error(S(425));
}
function fl() {}
var Yi = null,
	Gi = null;
function Xi(e, t) {
	return (
		e === 'textarea' ||
		e === 'noscript' ||
		typeof t.children == 'string' ||
		typeof t.children == 'number' ||
		(typeof t.dangerouslySetInnerHTML == 'object' &&
			t.dangerouslySetInnerHTML !== null &&
			t.dangerouslySetInnerHTML.__html != null)
	);
}
var qi = typeof setTimeout == 'function' ? setTimeout : void 0,
	gp = typeof clearTimeout == 'function' ? clearTimeout : void 0,
	es = typeof Promise == 'function' ? Promise : void 0,
	yp =
		typeof queueMicrotask == 'function'
			? queueMicrotask
			: typeof es < 'u'
				? function (e) {
						return es.resolve(null).then(e).catch(wp);
					}
				: qi;
function wp(e) {
	setTimeout(function () {
		throw e;
	});
}
function ci(e, t) {
	var n = t,
		r = 0;
	do {
		var l = n.nextSibling;
		if ((e.removeChild(n), l && l.nodeType === 8))
			if (((n = l.data), n === '/$')) {
				if (r === 0) {
					(e.removeChild(l), tr(t));
					return;
				}
				r--;
			} else (n !== '$' && n !== '$?' && n !== '$!') || r++;
		n = l;
	} while (n);
	tr(t);
}
function ht(e) {
	for (; e != null; e = e.nextSibling) {
		var t = e.nodeType;
		if (t === 1 || t === 3) break;
		if (t === 8) {
			if (((t = e.data), t === '$' || t === '$!' || t === '$?')) break;
			if (t === '/$') return null;
		}
	}
	return e;
}
function ts(e) {
	e = e.previousSibling;
	for (var t = 0; e; ) {
		if (e.nodeType === 8) {
			var n = e.data;
			if (n === '$' || n === '$!' || n === '$?') {
				if (t === 0) return e;
				t--;
			} else n === '/$' && t++;
		}
		e = e.previousSibling;
	}
	return null;
}
var _n = Math.random().toString(36).slice(2),
	Ue = '__reactFiber$' + _n,
	or = '__reactProps$' + _n,
	be = '__reactContainer$' + _n,
	Zi = '__reactEvents$' + _n,
	xp = '__reactListeners$' + _n,
	kp = '__reactHandles$' + _n;
function Dt(e) {
	var t = e[Ue];
	if (t) return t;
	for (var n = e.parentNode; n; ) {
		if ((t = n[be] || n[Ue])) {
			if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
				for (e = ts(e); e !== null; ) {
					if ((n = e[Ue])) return n;
					e = ts(e);
				}
			return t;
		}
		((e = n), (n = e.parentNode));
	}
	return null;
}
function yr(e) {
	return ((e = e[Ue] || e[be]), !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e);
}
function rn(e) {
	if (e.tag === 5 || e.tag === 6) return e.stateNode;
	throw Error(S(33));
}
function Rl(e) {
	return e[or] || null;
}
var Ji = [],
	ln = -1;
function Nt(e) {
	return { current: e };
}
function U(e) {
	0 > ln || ((e.current = Ji[ln]), (Ji[ln] = null), ln--);
}
function $(e, t) {
	(ln++, (Ji[ln] = e.current), (e.current = t));
}
var Et = {},
	se = Nt(Et),
	he = Nt(!1),
	Bt = Et;
function yn(e, t) {
	var n = e.type.contextTypes;
	if (!n) return Et;
	var r = e.stateNode;
	if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
	var l = {},
		i;
	for (i in n) l[i] = t[i];
	return (
		r &&
			((e = e.stateNode),
			(e.__reactInternalMemoizedUnmaskedChildContext = t),
			(e.__reactInternalMemoizedMaskedChildContext = l)),
		l
	);
}
function ve(e) {
	return ((e = e.childContextTypes), e != null);
}
function dl() {
	(U(he), U(se));
}
function ns(e, t, n) {
	if (se.current !== Et) throw Error(S(168));
	($(se, t), $(he, n));
}
function nc(e, t, n) {
	var r = e.stateNode;
	if (((t = t.childContextTypes), typeof r.getChildContext != 'function')) return n;
	r = r.getChildContext();
	for (var l in r) if (!(l in t)) throw Error(S(108, id(e) || 'Unknown', l));
	return Q({}, n, r);
}
function pl(e) {
	return (
		(e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || Et),
		(Bt = se.current),
		$(se, e),
		$(he, he.current),
		!0
	);
}
function rs(e, t, n) {
	var r = e.stateNode;
	if (!r) throw Error(S(169));
	(n ? ((e = nc(e, t, Bt)), (r.__reactInternalMemoizedMergedChildContext = e), U(he), U(se), $(se, e)) : U(he),
		$(he, n));
}
var Ye = null,
	jl = !1,
	fi = !1;
function rc(e) {
	Ye === null ? (Ye = [e]) : Ye.push(e);
}
function Sp(e) {
	((jl = !0), rc(e));
}
function _t() {
	if (!fi && Ye !== null) {
		fi = !0;
		var e = 0,
			t = I;
		try {
			var n = Ye;
			for (I = 1; e < n.length; e++) {
				var r = n[e];
				do r = r(!0);
				while (r !== null);
			}
			((Ye = null), (jl = !1));
		} catch (l) {
			throw (Ye !== null && (Ye = Ye.slice(e + 1)), Tu(Fo, _t), l);
		} finally {
			((I = t), (fi = !1));
		}
	}
	return null;
}
var on = [],
	an = 0,
	ml = null,
	hl = 0,
	Ne = [],
	_e = 0,
	Wt = null,
	Xe = 1,
	qe = '';
function zt(e, t) {
	((on[an++] = hl), (on[an++] = ml), (ml = e), (hl = t));
}
function lc(e, t, n) {
	((Ne[_e++] = Xe), (Ne[_e++] = qe), (Ne[_e++] = Wt), (Wt = e));
	var r = Xe;
	e = qe;
	var l = 32 - De(r) - 1;
	((r &= ~(1 << l)), (n += 1));
	var i = 32 - De(t) + l;
	if (30 < i) {
		var o = l - (l % 5);
		((i = (r & ((1 << o) - 1)).toString(32)),
			(r >>= o),
			(l -= o),
			(Xe = (1 << (32 - De(t) + l)) | (n << l) | r),
			(qe = i + e));
	} else ((Xe = (1 << i) | (n << l) | r), (qe = e));
}
function Qo(e) {
	e.return !== null && (zt(e, 1), lc(e, 1, 0));
}
function Ko(e) {
	for (; e === ml; ) ((ml = on[--an]), (on[an] = null), (hl = on[--an]), (on[an] = null));
	for (; e === Wt; )
		((Wt = Ne[--_e]), (Ne[_e] = null), (qe = Ne[--_e]), (Ne[_e] = null), (Xe = Ne[--_e]), (Ne[_e] = null));
}
var xe = null,
	we = null,
	B = !1,
	je = null;
function ic(e, t) {
	var n = Pe(5, null, null, 0);
	((n.elementType = 'DELETED'),
		(n.stateNode = t),
		(n.return = e),
		(t = e.deletions),
		t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function ls(e, t) {
	switch (e.tag) {
		case 5:
			var n = e.type;
			return (
				(t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
				t !== null ? ((e.stateNode = t), (xe = e), (we = ht(t.firstChild)), !0) : !1
			);
		case 6:
			return (
				(t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
				t !== null ? ((e.stateNode = t), (xe = e), (we = null), !0) : !1
			);
		case 13:
			return (
				(t = t.nodeType !== 8 ? null : t),
				t !== null
					? ((n = Wt !== null ? { id: Xe, overflow: qe } : null),
						(e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }),
						(n = Pe(18, null, null, 0)),
						(n.stateNode = t),
						(n.return = e),
						(e.child = n),
						(xe = e),
						(we = null),
						!0)
					: !1
			);
		default:
			return !1;
	}
}
function bi(e) {
	return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function eo(e) {
	if (B) {
		var t = we;
		if (t) {
			var n = t;
			if (!ls(e, t)) {
				if (bi(e)) throw Error(S(418));
				t = ht(n.nextSibling);
				var r = xe;
				t && ls(e, t) ? ic(r, n) : ((e.flags = (e.flags & -4097) | 2), (B = !1), (xe = e));
			}
		} else {
			if (bi(e)) throw Error(S(418));
			((e.flags = (e.flags & -4097) | 2), (B = !1), (xe = e));
		}
	}
}
function is(e) {
	for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
	xe = e;
}
function Dr(e) {
	if (e !== xe) return !1;
	if (!B) return (is(e), (B = !0), !1);
	var t;
	if (
		((t = e.tag !== 3) &&
			!(t = e.tag !== 5) &&
			((t = e.type), (t = t !== 'head' && t !== 'body' && !Xi(e.type, e.memoizedProps))),
		t && (t = we))
	) {
		if (bi(e)) throw (oc(), Error(S(418)));
		for (; t; ) (ic(e, t), (t = ht(t.nextSibling)));
	}
	if ((is(e), e.tag === 13)) {
		if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(S(317));
		e: {
			for (e = e.nextSibling, t = 0; e; ) {
				if (e.nodeType === 8) {
					var n = e.data;
					if (n === '/$') {
						if (t === 0) {
							we = ht(e.nextSibling);
							break e;
						}
						t--;
					} else (n !== '$' && n !== '$!' && n !== '$?') || t++;
				}
				e = e.nextSibling;
			}
			we = null;
		}
	} else we = xe ? ht(e.stateNode.nextSibling) : null;
	return !0;
}
function oc() {
	for (var e = we; e; ) e = ht(e.nextSibling);
}
function wn() {
	((we = xe = null), (B = !1));
}
function Yo(e) {
	je === null ? (je = [e]) : je.push(e);
}
var Ep = nt.ReactCurrentBatchConfig;
function Me(e, t) {
	if (e && e.defaultProps) {
		((t = Q({}, t)), (e = e.defaultProps));
		for (var n in e) t[n] === void 0 && (t[n] = e[n]);
		return t;
	}
	return t;
}
var vl = Nt(null),
	gl = null,
	sn = null,
	Go = null;
function Xo() {
	Go = sn = gl = null;
}
function qo(e) {
	var t = vl.current;
	(U(vl), (e._currentValue = t));
}
function to(e, t, n) {
	for (; e !== null; ) {
		var r = e.alternate;
		if (
			((e.childLanes & t) !== t
				? ((e.childLanes |= t), r !== null && (r.childLanes |= t))
				: r !== null && (r.childLanes & t) !== t && (r.childLanes |= t),
			e === n)
		)
			break;
		e = e.return;
	}
}
function hn(e, t) {
	((gl = e),
		(Go = sn = null),
		(e = e.dependencies),
		e !== null && e.firstContext !== null && (e.lanes & t && (me = !0), (e.firstContext = null)));
}
function Le(e) {
	var t = e._currentValue;
	if (Go !== e)
		if (((e = { context: e, memoizedValue: t, next: null }), sn === null)) {
			if (gl === null) throw Error(S(308));
			((sn = e), (gl.dependencies = { lanes: 0, firstContext: e }));
		} else sn = sn.next = e;
	return t;
}
var Ft = null;
function Zo(e) {
	Ft === null ? (Ft = [e]) : Ft.push(e);
}
function ac(e, t, n, r) {
	var l = t.interleaved;
	return (l === null ? ((n.next = n), Zo(t)) : ((n.next = l.next), (l.next = n)), (t.interleaved = n), et(e, r));
}
function et(e, t) {
	e.lanes |= t;
	var n = e.alternate;
	for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
		((e.childLanes |= t), (n = e.alternate), n !== null && (n.childLanes |= t), (n = e), (e = e.return));
	return n.tag === 3 ? n.stateNode : null;
}
var ot = !1;
function Jo(e) {
	e.updateQueue = {
		baseState: e.memoizedState,
		firstBaseUpdate: null,
		lastBaseUpdate: null,
		shared: { pending: null, interleaved: null, lanes: 0 },
		effects: null,
	};
}
function sc(e, t) {
	((e = e.updateQueue),
		t.updateQueue === e &&
			(t.updateQueue = {
				baseState: e.baseState,
				firstBaseUpdate: e.firstBaseUpdate,
				lastBaseUpdate: e.lastBaseUpdate,
				shared: e.shared,
				effects: e.effects,
			}));
}
function Ze(e, t) {
	return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function vt(e, t, n) {
	var r = e.updateQueue;
	if (r === null) return null;
	if (((r = r.shared), F & 2)) {
		var l = r.pending;
		return (l === null ? (t.next = t) : ((t.next = l.next), (l.next = t)), (r.pending = t), et(e, n));
	}
	return (
		(l = r.interleaved),
		l === null ? ((t.next = t), Zo(r)) : ((t.next = l.next), (l.next = t)),
		(r.interleaved = t),
		et(e, n)
	);
}
function Gr(e, t, n) {
	if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))) {
		var r = t.lanes;
		((r &= e.pendingLanes), (n |= r), (t.lanes = n), Io(e, n));
	}
}
function os(e, t) {
	var n = e.updateQueue,
		r = e.alternate;
	if (r !== null && ((r = r.updateQueue), n === r)) {
		var l = null,
			i = null;
		if (((n = n.firstBaseUpdate), n !== null)) {
			do {
				var o = {
					eventTime: n.eventTime,
					lane: n.lane,
					tag: n.tag,
					payload: n.payload,
					callback: n.callback,
					next: null,
				};
				(i === null ? (l = i = o) : (i = i.next = o), (n = n.next));
			} while (n !== null);
			i === null ? (l = i = t) : (i = i.next = t);
		} else l = i = t;
		((n = { baseState: r.baseState, firstBaseUpdate: l, lastBaseUpdate: i, shared: r.shared, effects: r.effects }),
			(e.updateQueue = n));
		return;
	}
	((e = n.lastBaseUpdate), e === null ? (n.firstBaseUpdate = t) : (e.next = t), (n.lastBaseUpdate = t));
}
function yl(e, t, n, r) {
	var l = e.updateQueue;
	ot = !1;
	var i = l.firstBaseUpdate,
		o = l.lastBaseUpdate,
		a = l.shared.pending;
	if (a !== null) {
		l.shared.pending = null;
		var s = a,
			u = s.next;
		((s.next = null), o === null ? (i = u) : (o.next = u), (o = s));
		var m = e.alternate;
		m !== null &&
			((m = m.updateQueue),
			(a = m.lastBaseUpdate),
			a !== o && (a === null ? (m.firstBaseUpdate = u) : (a.next = u), (m.lastBaseUpdate = s)));
	}
	if (i !== null) {
		var v = l.baseState;
		((o = 0), (m = u = s = null), (a = i));
		do {
			var h = a.lane,
				w = a.eventTime;
			if ((r & h) === h) {
				m !== null &&
					(m = m.next =
						{ eventTime: w, lane: 0, tag: a.tag, payload: a.payload, callback: a.callback, next: null });
				e: {
					var C = e,
						N = a;
					switch (((h = t), (w = n), N.tag)) {
						case 1:
							if (((C = N.payload), typeof C == 'function')) {
								v = C.call(w, v, h);
								break e;
							}
							v = C;
							break e;
						case 3:
							C.flags = (C.flags & -65537) | 128;
						case 0:
							if (((C = N.payload), (h = typeof C == 'function' ? C.call(w, v, h) : C), h == null))
								break e;
							v = Q({}, v, h);
							break e;
						case 2:
							ot = !0;
					}
				}
				a.callback !== null &&
					a.lane !== 0 &&
					((e.flags |= 64), (h = l.effects), h === null ? (l.effects = [a]) : h.push(a));
			} else
				((w = { eventTime: w, lane: h, tag: a.tag, payload: a.payload, callback: a.callback, next: null }),
					m === null ? ((u = m = w), (s = v)) : (m = m.next = w),
					(o |= h));
			if (((a = a.next), a === null)) {
				if (((a = l.shared.pending), a === null)) break;
				((h = a), (a = h.next), (h.next = null), (l.lastBaseUpdate = h), (l.shared.pending = null));
			}
		} while (1);
		if (
			(m === null && (s = v),
			(l.baseState = s),
			(l.firstBaseUpdate = u),
			(l.lastBaseUpdate = m),
			(t = l.shared.interleaved),
			t !== null)
		) {
			l = t;
			do ((o |= l.lane), (l = l.next));
			while (l !== t);
		} else i === null && (l.shared.lanes = 0);
		((Vt |= o), (e.lanes = o), (e.memoizedState = v));
	}
}
function as(e, t, n) {
	if (((e = t.effects), (t.effects = null), e !== null))
		for (t = 0; t < e.length; t++) {
			var r = e[t],
				l = r.callback;
			if (l !== null) {
				if (((r.callback = null), (r = n), typeof l != 'function')) throw Error(S(191, l));
				l.call(r);
			}
		}
}
var uc = new au.Component().refs;
function no(e, t, n, r) {
	((t = e.memoizedState),
		(n = n(r, t)),
		(n = n == null ? t : Q({}, t, n)),
		(e.memoizedState = n),
		e.lanes === 0 && (e.updateQueue.baseState = n));
}
var Dl = {
	isMounted: function (e) {
		return (e = e._reactInternals) ? Yt(e) === e : !1;
	},
	enqueueSetState: function (e, t, n) {
		e = e._reactInternals;
		var r = ce(),
			l = yt(e),
			i = Ze(r, l);
		((i.payload = t),
			n != null && (i.callback = n),
			(t = vt(e, i, l)),
			t !== null && (Fe(t, e, l, r), Gr(t, e, l)));
	},
	enqueueReplaceState: function (e, t, n) {
		e = e._reactInternals;
		var r = ce(),
			l = yt(e),
			i = Ze(r, l);
		((i.tag = 1),
			(i.payload = t),
			n != null && (i.callback = n),
			(t = vt(e, i, l)),
			t !== null && (Fe(t, e, l, r), Gr(t, e, l)));
	},
	enqueueForceUpdate: function (e, t) {
		e = e._reactInternals;
		var n = ce(),
			r = yt(e),
			l = Ze(n, r);
		((l.tag = 2), t != null && (l.callback = t), (t = vt(e, l, r)), t !== null && (Fe(t, e, r, n), Gr(t, e, r)));
	},
};
function ss(e, t, n, r, l, i, o) {
	return (
		(e = e.stateNode),
		typeof e.shouldComponentUpdate == 'function'
			? e.shouldComponentUpdate(r, i, o)
			: t.prototype && t.prototype.isPureReactComponent
				? !rr(n, r) || !rr(l, i)
				: !0
	);
}
function cc(e, t, n) {
	var r = !1,
		l = Et,
		i = t.contextType;
	return (
		typeof i == 'object' && i !== null
			? (i = Le(i))
			: ((l = ve(t) ? Bt : se.current), (r = t.contextTypes), (i = (r = r != null) ? yn(e, l) : Et)),
		(t = new t(n, i)),
		(e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
		(t.updater = Dl),
		(e.stateNode = t),
		(t._reactInternals = e),
		r &&
			((e = e.stateNode),
			(e.__reactInternalMemoizedUnmaskedChildContext = l),
			(e.__reactInternalMemoizedMaskedChildContext = i)),
		t
	);
}
function us(e, t, n, r) {
	((e = t.state),
		typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(n, r),
		typeof t.UNSAFE_componentWillReceiveProps == 'function' && t.UNSAFE_componentWillReceiveProps(n, r),
		t.state !== e && Dl.enqueueReplaceState(t, t.state, null));
}
function ro(e, t, n, r) {
	var l = e.stateNode;
	((l.props = n), (l.state = e.memoizedState), (l.refs = uc), Jo(e));
	var i = t.contextType;
	(typeof i == 'object' && i !== null ? (l.context = Le(i)) : ((i = ve(t) ? Bt : se.current), (l.context = yn(e, i))),
		(l.state = e.memoizedState),
		(i = t.getDerivedStateFromProps),
		typeof i == 'function' && (no(e, t, i, n), (l.state = e.memoizedState)),
		typeof t.getDerivedStateFromProps == 'function' ||
			typeof l.getSnapshotBeforeUpdate == 'function' ||
			(typeof l.UNSAFE_componentWillMount != 'function' && typeof l.componentWillMount != 'function') ||
			((t = l.state),
			typeof l.componentWillMount == 'function' && l.componentWillMount(),
			typeof l.UNSAFE_componentWillMount == 'function' && l.UNSAFE_componentWillMount(),
			t !== l.state && Dl.enqueueReplaceState(l, l.state, null),
			yl(e, n, l, r),
			(l.state = e.memoizedState)),
		typeof l.componentDidMount == 'function' && (e.flags |= 4194308));
}
function Mn(e, t, n) {
	if (((e = n.ref), e !== null && typeof e != 'function' && typeof e != 'object')) {
		if (n._owner) {
			if (((n = n._owner), n)) {
				if (n.tag !== 1) throw Error(S(309));
				var r = n.stateNode;
			}
			if (!r) throw Error(S(147, e));
			var l = r,
				i = '' + e;
			return t !== null && t.ref !== null && typeof t.ref == 'function' && t.ref._stringRef === i
				? t.ref
				: ((t = function (o) {
						var a = l.refs;
						(a === uc && (a = l.refs = {}), o === null ? delete a[i] : (a[i] = o));
					}),
					(t._stringRef = i),
					t);
		}
		if (typeof e != 'string') throw Error(S(284));
		if (!n._owner) throw Error(S(290, e));
	}
	return e;
}
function Fr(e, t) {
	throw (
		(e = Object.prototype.toString.call(t)),
		Error(S(31, e === '[object Object]' ? 'object with keys {' + Object.keys(t).join(', ') + '}' : e))
	);
}
function cs(e) {
	var t = e._init;
	return t(e._payload);
}
function fc(e) {
	function t(f, c) {
		if (e) {
			var p = f.deletions;
			p === null ? ((f.deletions = [c]), (f.flags |= 16)) : p.push(c);
		}
	}
	function n(f, c) {
		if (!e) return null;
		for (; c !== null; ) (t(f, c), (c = c.sibling));
		return null;
	}
	function r(f, c) {
		for (f = new Map(); c !== null; ) (c.key !== null ? f.set(c.key, c) : f.set(c.index, c), (c = c.sibling));
		return f;
	}
	function l(f, c) {
		return ((f = wt(f, c)), (f.index = 0), (f.sibling = null), f);
	}
	function i(f, c, p) {
		return (
			(f.index = p),
			e
				? ((p = f.alternate),
					p !== null ? ((p = p.index), p < c ? ((f.flags |= 2), c) : p) : ((f.flags |= 2), c))
				: ((f.flags |= 1048576), c)
		);
	}
	function o(f) {
		return (e && f.alternate === null && (f.flags |= 2), f);
	}
	function a(f, c, p, y) {
		return c === null || c.tag !== 6
			? ((c = yi(p, f.mode, y)), (c.return = f), c)
			: ((c = l(c, p)), (c.return = f), c);
	}
	function s(f, c, p, y) {
		var E = p.type;
		return E === bt
			? m(f, c, p.props.children, y, p.key)
			: c !== null &&
				  (c.elementType === E || (typeof E == 'object' && E !== null && E.$$typeof === it && cs(E) === c.type))
				? ((y = l(c, p.props)), (y.ref = Mn(f, c, p)), (y.return = f), y)
				: ((y = el(p.type, p.key, p.props, null, f.mode, y)), (y.ref = Mn(f, c, p)), (y.return = f), y);
	}
	function u(f, c, p, y) {
		return c === null ||
			c.tag !== 4 ||
			c.stateNode.containerInfo !== p.containerInfo ||
			c.stateNode.implementation !== p.implementation
			? ((c = wi(p, f.mode, y)), (c.return = f), c)
			: ((c = l(c, p.children || [])), (c.return = f), c);
	}
	function m(f, c, p, y, E) {
		return c === null || c.tag !== 7
			? ((c = Ut(p, f.mode, y, E)), (c.return = f), c)
			: ((c = l(c, p)), (c.return = f), c);
	}
	function v(f, c, p) {
		if ((typeof c == 'string' && c !== '') || typeof c == 'number')
			return ((c = yi('' + c, f.mode, p)), (c.return = f), c);
		if (typeof c == 'object' && c !== null) {
			switch (c.$$typeof) {
				case Nr:
					return (
						(p = el(c.type, c.key, c.props, null, f.mode, p)),
						(p.ref = Mn(f, null, c)),
						(p.return = f),
						p
					);
				case Jt:
					return ((c = wi(c, f.mode, p)), (c.return = f), c);
				case it:
					var y = c._init;
					return v(f, y(c._payload), p);
			}
			if (Fn(c) || Pn(c)) return ((c = Ut(c, f.mode, p, null)), (c.return = f), c);
			Fr(f, c);
		}
		return null;
	}
	function h(f, c, p, y) {
		var E = c !== null ? c.key : null;
		if ((typeof p == 'string' && p !== '') || typeof p == 'number') return E !== null ? null : a(f, c, '' + p, y);
		if (typeof p == 'object' && p !== null) {
			switch (p.$$typeof) {
				case Nr:
					return p.key === E ? s(f, c, p, y) : null;
				case Jt:
					return p.key === E ? u(f, c, p, y) : null;
				case it:
					return ((E = p._init), h(f, c, E(p._payload), y));
			}
			if (Fn(p) || Pn(p)) return E !== null ? null : m(f, c, p, y, null);
			Fr(f, p);
		}
		return null;
	}
	function w(f, c, p, y, E) {
		if ((typeof y == 'string' && y !== '') || typeof y == 'number')
			return ((f = f.get(p) || null), a(c, f, '' + y, E));
		if (typeof y == 'object' && y !== null) {
			switch (y.$$typeof) {
				case Nr:
					return ((f = f.get(y.key === null ? p : y.key) || null), s(c, f, y, E));
				case Jt:
					return ((f = f.get(y.key === null ? p : y.key) || null), u(c, f, y, E));
				case it:
					var x = y._init;
					return w(f, c, p, x(y._payload), E);
			}
			if (Fn(y) || Pn(y)) return ((f = f.get(p) || null), m(c, f, y, E, null));
			Fr(c, y);
		}
		return null;
	}
	function C(f, c, p, y) {
		for (var E = null, x = null, g = c, k = (c = 0), O = null; g !== null && k < p.length; k++) {
			g.index > k ? ((O = g), (g = null)) : (O = g.sibling);
			var z = h(f, g, p[k], y);
			if (z === null) {
				g === null && (g = O);
				break;
			}
			(e && g && z.alternate === null && t(f, g),
				(c = i(z, c, k)),
				x === null ? (E = z) : (x.sibling = z),
				(x = z),
				(g = O));
		}
		if (k === p.length) return (n(f, g), B && zt(f, k), E);
		if (g === null) {
			for (; k < p.length; k++)
				((g = v(f, p[k], y)),
					g !== null && ((c = i(g, c, k)), x === null ? (E = g) : (x.sibling = g), (x = g)));
			return (B && zt(f, k), E);
		}
		for (g = r(f, g); k < p.length; k++)
			((O = w(g, f, k, p[k], y)),
				O !== null &&
					(e && O.alternate !== null && g.delete(O.key === null ? k : O.key),
					(c = i(O, c, k)),
					x === null ? (E = O) : (x.sibling = O),
					(x = O)));
		return (
			e &&
				g.forEach(function (W) {
					return t(f, W);
				}),
			B && zt(f, k),
			E
		);
	}
	function N(f, c, p, y) {
		var E = Pn(p);
		if (typeof E != 'function') throw Error(S(150));
		if (((p = E.call(p)), p == null)) throw Error(S(151));
		for (var x = (E = null), g = c, k = (c = 0), O = null, z = p.next(); g !== null && !z.done; k++, z = p.next()) {
			g.index > k ? ((O = g), (g = null)) : (O = g.sibling);
			var W = h(f, g, z.value, y);
			if (W === null) {
				g === null && (g = O);
				break;
			}
			(e && g && W.alternate === null && t(f, g),
				(c = i(W, c, k)),
				x === null ? (E = W) : (x.sibling = W),
				(x = W),
				(g = O));
		}
		if (z.done) return (n(f, g), B && zt(f, k), E);
		if (g === null) {
			for (; !z.done; k++, z = p.next())
				((z = v(f, z.value, y)),
					z !== null && ((c = i(z, c, k)), x === null ? (E = z) : (x.sibling = z), (x = z)));
			return (B && zt(f, k), E);
		}
		for (g = r(f, g); !z.done; k++, z = p.next())
			((z = w(g, f, k, z.value, y)),
				z !== null &&
					(e && z.alternate !== null && g.delete(z.key === null ? k : z.key),
					(c = i(z, c, k)),
					x === null ? (E = z) : (x.sibling = z),
					(x = z)));
		return (
			e &&
				g.forEach(function (Ce) {
					return t(f, Ce);
				}),
			B && zt(f, k),
			E
		);
	}
	function j(f, c, p, y) {
		if (
			(typeof p == 'object' && p !== null && p.type === bt && p.key === null && (p = p.props.children),
			typeof p == 'object' && p !== null)
		) {
			switch (p.$$typeof) {
				case Nr:
					e: {
						for (var E = p.key, x = c; x !== null; ) {
							if (x.key === E) {
								if (((E = p.type), E === bt)) {
									if (x.tag === 7) {
										(n(f, x.sibling), (c = l(x, p.props.children)), (c.return = f), (f = c));
										break e;
									}
								} else if (
									x.elementType === E ||
									(typeof E == 'object' && E !== null && E.$$typeof === it && cs(E) === x.type)
								) {
									(n(f, x.sibling),
										(c = l(x, p.props)),
										(c.ref = Mn(f, x, p)),
										(c.return = f),
										(f = c));
									break e;
								}
								n(f, x);
								break;
							} else t(f, x);
							x = x.sibling;
						}
						p.type === bt
							? ((c = Ut(p.props.children, f.mode, y, p.key)), (c.return = f), (f = c))
							: ((y = el(p.type, p.key, p.props, null, f.mode, y)),
								(y.ref = Mn(f, c, p)),
								(y.return = f),
								(f = y));
					}
					return o(f);
				case Jt:
					e: {
						for (x = p.key; c !== null; ) {
							if (c.key === x)
								if (
									c.tag === 4 &&
									c.stateNode.containerInfo === p.containerInfo &&
									c.stateNode.implementation === p.implementation
								) {
									(n(f, c.sibling), (c = l(c, p.children || [])), (c.return = f), (f = c));
									break e;
								} else {
									n(f, c);
									break;
								}
							else t(f, c);
							c = c.sibling;
						}
						((c = wi(p, f.mode, y)), (c.return = f), (f = c));
					}
					return o(f);
				case it:
					return ((x = p._init), j(f, c, x(p._payload), y));
			}
			if (Fn(p)) return C(f, c, p, y);
			if (Pn(p)) return N(f, c, p, y);
			Fr(f, p);
		}
		return (typeof p == 'string' && p !== '') || typeof p == 'number'
			? ((p = '' + p),
				c !== null && c.tag === 6
					? (n(f, c.sibling), (c = l(c, p)), (c.return = f), (f = c))
					: (n(f, c), (c = yi(p, f.mode, y)), (c.return = f), (f = c)),
				o(f))
			: n(f, c);
	}
	return j;
}
var xn = fc(!0),
	dc = fc(!1),
	wr = {},
	He = Nt(wr),
	ar = Nt(wr),
	sr = Nt(wr);
function It(e) {
	if (e === wr) throw Error(S(174));
	return e;
}
function bo(e, t) {
	switch (($(sr, t), $(ar, e), $(He, wr), (e = t.nodeType), e)) {
		case 9:
		case 11:
			t = (t = t.documentElement) ? t.namespaceURI : Di(null, '');
			break;
		default:
			((e = e === 8 ? t.parentNode : t), (t = e.namespaceURI || null), (e = e.tagName), (t = Di(t, e)));
	}
	(U(He), $(He, t));
}
function kn() {
	(U(He), U(ar), U(sr));
}
function pc(e) {
	It(sr.current);
	var t = It(He.current),
		n = Di(t, e.type);
	t !== n && ($(ar, e), $(He, n));
}
function ea(e) {
	ar.current === e && (U(He), U(ar));
}
var H = Nt(0);
function wl(e) {
	for (var t = e; t !== null; ) {
		if (t.tag === 13) {
			var n = t.memoizedState;
			if (n !== null && ((n = n.dehydrated), n === null || n.data === '$?' || n.data === '$!')) return t;
		} else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
			if (t.flags & 128) return t;
		} else if (t.child !== null) {
			((t.child.return = t), (t = t.child));
			continue;
		}
		if (t === e) break;
		for (; t.sibling === null; ) {
			if (t.return === null || t.return === e) return null;
			t = t.return;
		}
		((t.sibling.return = t.return), (t = t.sibling));
	}
	return null;
}
var di = [];
function ta() {
	for (var e = 0; e < di.length; e++) di[e]._workInProgressVersionPrimary = null;
	di.length = 0;
}
var Xr = nt.ReactCurrentDispatcher,
	pi = nt.ReactCurrentBatchConfig,
	Ht = 0,
	V = null,
	Z = null,
	ee = null,
	xl = !1,
	Qn = !1,
	ur = 0,
	Cp = 0;
function ie() {
	throw Error(S(321));
}
function na(e, t) {
	if (t === null) return !1;
	for (var n = 0; n < t.length && n < e.length; n++) if (!Ie(e[n], t[n])) return !1;
	return !0;
}
function ra(e, t, n, r, l, i) {
	if (
		((Ht = i),
		(V = t),
		(t.memoizedState = null),
		(t.updateQueue = null),
		(t.lanes = 0),
		(Xr.current = e === null || e.memoizedState === null ? Tp : Lp),
		(e = n(r, l)),
		Qn)
	) {
		i = 0;
		do {
			if (((Qn = !1), (ur = 0), 25 <= i)) throw Error(S(301));
			((i += 1), (ee = Z = null), (t.updateQueue = null), (Xr.current = zp), (e = n(r, l)));
		} while (Qn);
	}
	if (((Xr.current = kl), (t = Z !== null && Z.next !== null), (Ht = 0), (ee = Z = V = null), (xl = !1), t))
		throw Error(S(300));
	return e;
}
function la() {
	var e = ur !== 0;
	return ((ur = 0), e);
}
function Ae() {
	var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
	return (ee === null ? (V.memoizedState = ee = e) : (ee = ee.next = e), ee);
}
function ze() {
	if (Z === null) {
		var e = V.alternate;
		e = e !== null ? e.memoizedState : null;
	} else e = Z.next;
	var t = ee === null ? V.memoizedState : ee.next;
	if (t !== null) ((ee = t), (Z = e));
	else {
		if (e === null) throw Error(S(310));
		((Z = e),
			(e = {
				memoizedState: Z.memoizedState,
				baseState: Z.baseState,
				baseQueue: Z.baseQueue,
				queue: Z.queue,
				next: null,
			}),
			ee === null ? (V.memoizedState = ee = e) : (ee = ee.next = e));
	}
	return ee;
}
function cr(e, t) {
	return typeof t == 'function' ? t(e) : t;
}
function mi(e) {
	var t = ze(),
		n = t.queue;
	if (n === null) throw Error(S(311));
	n.lastRenderedReducer = e;
	var r = Z,
		l = r.baseQueue,
		i = n.pending;
	if (i !== null) {
		if (l !== null) {
			var o = l.next;
			((l.next = i.next), (i.next = o));
		}
		((r.baseQueue = l = i), (n.pending = null));
	}
	if (l !== null) {
		((i = l.next), (r = r.baseState));
		var a = (o = null),
			s = null,
			u = i;
		do {
			var m = u.lane;
			if ((Ht & m) === m)
				(s !== null &&
					(s = s.next =
						{
							lane: 0,
							action: u.action,
							hasEagerState: u.hasEagerState,
							eagerState: u.eagerState,
							next: null,
						}),
					(r = u.hasEagerState ? u.eagerState : e(r, u.action)));
			else {
				var v = {
					lane: m,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null,
				};
				(s === null ? ((a = s = v), (o = r)) : (s = s.next = v), (V.lanes |= m), (Vt |= m));
			}
			u = u.next;
		} while (u !== null && u !== i);
		(s === null ? (o = r) : (s.next = a),
			Ie(r, t.memoizedState) || (me = !0),
			(t.memoizedState = r),
			(t.baseState = o),
			(t.baseQueue = s),
			(n.lastRenderedState = r));
	}
	if (((e = n.interleaved), e !== null)) {
		l = e;
		do ((i = l.lane), (V.lanes |= i), (Vt |= i), (l = l.next));
		while (l !== e);
	} else l === null && (n.lanes = 0);
	return [t.memoizedState, n.dispatch];
}
function hi(e) {
	var t = ze(),
		n = t.queue;
	if (n === null) throw Error(S(311));
	n.lastRenderedReducer = e;
	var r = n.dispatch,
		l = n.pending,
		i = t.memoizedState;
	if (l !== null) {
		n.pending = null;
		var o = (l = l.next);
		do ((i = e(i, o.action)), (o = o.next));
		while (o !== l);
		(Ie(i, t.memoizedState) || (me = !0),
			(t.memoizedState = i),
			t.baseQueue === null && (t.baseState = i),
			(n.lastRenderedState = i));
	}
	return [i, r];
}
function mc() {}
function hc(e, t) {
	var n = V,
		r = ze(),
		l = t(),
		i = !Ie(r.memoizedState, l);
	if (
		(i && ((r.memoizedState = l), (me = !0)),
		(r = r.queue),
		ia(yc.bind(null, n, r, e), [e]),
		r.getSnapshot !== t || i || (ee !== null && ee.memoizedState.tag & 1))
	) {
		if (((n.flags |= 2048), fr(9, gc.bind(null, n, r, l, t), void 0, null), te === null)) throw Error(S(349));
		Ht & 30 || vc(n, t, l);
	}
	return l;
}
function vc(e, t, n) {
	((e.flags |= 16384),
		(e = { getSnapshot: t, value: n }),
		(t = V.updateQueue),
		t === null
			? ((t = { lastEffect: null, stores: null }), (V.updateQueue = t), (t.stores = [e]))
			: ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function gc(e, t, n, r) {
	((t.value = n), (t.getSnapshot = r), wc(t) && xc(e));
}
function yc(e, t, n) {
	return n(function () {
		wc(t) && xc(e);
	});
}
function wc(e) {
	var t = e.getSnapshot;
	e = e.value;
	try {
		var n = t();
		return !Ie(e, n);
	} catch {
		return !0;
	}
}
function xc(e) {
	var t = et(e, 1);
	t !== null && Fe(t, e, 1, -1);
}
function fs(e) {
	var t = Ae();
	return (
		typeof e == 'function' && (e = e()),
		(t.memoizedState = t.baseState = e),
		(e = {
			pending: null,
			interleaved: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: cr,
			lastRenderedState: e,
		}),
		(t.queue = e),
		(e = e.dispatch = Pp.bind(null, V, e)),
		[t.memoizedState, e]
	);
}
function fr(e, t, n, r) {
	return (
		(e = { tag: e, create: t, destroy: n, deps: r, next: null }),
		(t = V.updateQueue),
		t === null
			? ((t = { lastEffect: null, stores: null }), (V.updateQueue = t), (t.lastEffect = e.next = e))
			: ((n = t.lastEffect),
				n === null
					? (t.lastEffect = e.next = e)
					: ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
		e
	);
}
function kc() {
	return ze().memoizedState;
}
function qr(e, t, n, r) {
	var l = Ae();
	((V.flags |= e), (l.memoizedState = fr(1 | t, n, void 0, r === void 0 ? null : r)));
}
function Fl(e, t, n, r) {
	var l = ze();
	r = r === void 0 ? null : r;
	var i = void 0;
	if (Z !== null) {
		var o = Z.memoizedState;
		if (((i = o.destroy), r !== null && na(r, o.deps))) {
			l.memoizedState = fr(t, n, i, r);
			return;
		}
	}
	((V.flags |= e), (l.memoizedState = fr(1 | t, n, i, r)));
}
function ds(e, t) {
	return qr(8390656, 8, e, t);
}
function ia(e, t) {
	return Fl(2048, 8, e, t);
}
function Sc(e, t) {
	return Fl(4, 2, e, t);
}
function Ec(e, t) {
	return Fl(4, 4, e, t);
}
function Cc(e, t) {
	if (typeof t == 'function')
		return (
			(e = e()),
			t(e),
			function () {
				t(null);
			}
		);
	if (t != null)
		return (
			(e = e()),
			(t.current = e),
			function () {
				t.current = null;
			}
		);
}
function Nc(e, t, n) {
	return ((n = n != null ? n.concat([e]) : null), Fl(4, 4, Cc.bind(null, t, e), n));
}
function oa() {}
function _c(e, t) {
	var n = ze();
	t = t === void 0 ? null : t;
	var r = n.memoizedState;
	return r !== null && t !== null && na(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
}
function Pc(e, t) {
	var n = ze();
	t = t === void 0 ? null : t;
	var r = n.memoizedState;
	return r !== null && t !== null && na(t, r[1]) ? r[0] : ((e = e()), (n.memoizedState = [e, t]), e);
}
function Tc(e, t, n) {
	return Ht & 21
		? (Ie(n, t) || ((n = Ou()), (V.lanes |= n), (Vt |= n), (e.baseState = !0)), t)
		: (e.baseState && ((e.baseState = !1), (me = !0)), (e.memoizedState = n));
}
function Np(e, t) {
	var n = I;
	((I = n !== 0 && 4 > n ? n : 4), e(!0));
	var r = pi.transition;
	pi.transition = {};
	try {
		(e(!1), t());
	} finally {
		((I = n), (pi.transition = r));
	}
}
function Lc() {
	return ze().memoizedState;
}
function _p(e, t, n) {
	var r = yt(e);
	if (((n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }), zc(e))) Oc(t, n);
	else if (((n = ac(e, t, n, r)), n !== null)) {
		var l = ce();
		(Fe(n, e, r, l), Mc(n, t, r));
	}
}
function Pp(e, t, n) {
	var r = yt(e),
		l = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
	if (zc(e)) Oc(t, l);
	else {
		var i = e.alternate;
		if (e.lanes === 0 && (i === null || i.lanes === 0) && ((i = t.lastRenderedReducer), i !== null))
			try {
				var o = t.lastRenderedState,
					a = i(o, n);
				if (((l.hasEagerState = !0), (l.eagerState = a), Ie(a, o))) {
					var s = t.interleaved;
					(s === null ? ((l.next = l), Zo(t)) : ((l.next = s.next), (s.next = l)), (t.interleaved = l));
					return;
				}
			} catch {
			} finally {
			}
		((n = ac(e, t, l, r)), n !== null && ((l = ce()), Fe(n, e, r, l), Mc(n, t, r)));
	}
}
function zc(e) {
	var t = e.alternate;
	return e === V || (t !== null && t === V);
}
function Oc(e, t) {
	Qn = xl = !0;
	var n = e.pending;
	(n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t));
}
function Mc(e, t, n) {
	if (n & 4194240) {
		var r = t.lanes;
		((r &= e.pendingLanes), (n |= r), (t.lanes = n), Io(e, n));
	}
}
var kl = {
		readContext: Le,
		useCallback: ie,
		useContext: ie,
		useEffect: ie,
		useImperativeHandle: ie,
		useInsertionEffect: ie,
		useLayoutEffect: ie,
		useMemo: ie,
		useReducer: ie,
		useRef: ie,
		useState: ie,
		useDebugValue: ie,
		useDeferredValue: ie,
		useTransition: ie,
		useMutableSource: ie,
		useSyncExternalStore: ie,
		useId: ie,
		unstable_isNewReconciler: !1,
	},
	Tp = {
		readContext: Le,
		useCallback: function (e, t) {
			return ((Ae().memoizedState = [e, t === void 0 ? null : t]), e);
		},
		useContext: Le,
		useEffect: ds,
		useImperativeHandle: function (e, t, n) {
			return ((n = n != null ? n.concat([e]) : null), qr(4194308, 4, Cc.bind(null, t, e), n));
		},
		useLayoutEffect: function (e, t) {
			return qr(4194308, 4, e, t);
		},
		useInsertionEffect: function (e, t) {
			return qr(4, 2, e, t);
		},
		useMemo: function (e, t) {
			var n = Ae();
			return ((t = t === void 0 ? null : t), (e = e()), (n.memoizedState = [e, t]), e);
		},
		useReducer: function (e, t, n) {
			var r = Ae();
			return (
				(t = n !== void 0 ? n(t) : t),
				(r.memoizedState = r.baseState = t),
				(e = {
					pending: null,
					interleaved: null,
					lanes: 0,
					dispatch: null,
					lastRenderedReducer: e,
					lastRenderedState: t,
				}),
				(r.queue = e),
				(e = e.dispatch = _p.bind(null, V, e)),
				[r.memoizedState, e]
			);
		},
		useRef: function (e) {
			var t = Ae();
			return ((e = { current: e }), (t.memoizedState = e));
		},
		useState: fs,
		useDebugValue: oa,
		useDeferredValue: function (e) {
			return (Ae().memoizedState = e);
		},
		useTransition: function () {
			var e = fs(!1),
				t = e[0];
			return ((e = Np.bind(null, e[1])), (Ae().memoizedState = e), [t, e]);
		},
		useMutableSource: function () {},
		useSyncExternalStore: function (e, t, n) {
			var r = V,
				l = Ae();
			if (B) {
				if (n === void 0) throw Error(S(407));
				n = n();
			} else {
				if (((n = t()), te === null)) throw Error(S(349));
				Ht & 30 || vc(r, t, n);
			}
			l.memoizedState = n;
			var i = { value: n, getSnapshot: t };
			return (
				(l.queue = i),
				ds(yc.bind(null, r, i, e), [e]),
				(r.flags |= 2048),
				fr(9, gc.bind(null, r, i, n, t), void 0, null),
				n
			);
		},
		useId: function () {
			var e = Ae(),
				t = te.identifierPrefix;
			if (B) {
				var n = qe,
					r = Xe;
				((n = (r & ~(1 << (32 - De(r) - 1))).toString(32) + n),
					(t = ':' + t + 'R' + n),
					(n = ur++),
					0 < n && (t += 'H' + n.toString(32)),
					(t += ':'));
			} else ((n = Cp++), (t = ':' + t + 'r' + n.toString(32) + ':'));
			return (e.memoizedState = t);
		},
		unstable_isNewReconciler: !1,
	},
	Lp = {
		readContext: Le,
		useCallback: _c,
		useContext: Le,
		useEffect: ia,
		useImperativeHandle: Nc,
		useInsertionEffect: Sc,
		useLayoutEffect: Ec,
		useMemo: Pc,
		useReducer: mi,
		useRef: kc,
		useState: function () {
			return mi(cr);
		},
		useDebugValue: oa,
		useDeferredValue: function (e) {
			var t = ze();
			return Tc(t, Z.memoizedState, e);
		},
		useTransition: function () {
			var e = mi(cr)[0],
				t = ze().memoizedState;
			return [e, t];
		},
		useMutableSource: mc,
		useSyncExternalStore: hc,
		useId: Lc,
		unstable_isNewReconciler: !1,
	},
	zp = {
		readContext: Le,
		useCallback: _c,
		useContext: Le,
		useEffect: ia,
		useImperativeHandle: Nc,
		useInsertionEffect: Sc,
		useLayoutEffect: Ec,
		useMemo: Pc,
		useReducer: hi,
		useRef: kc,
		useState: function () {
			return hi(cr);
		},
		useDebugValue: oa,
		useDeferredValue: function (e) {
			var t = ze();
			return Z === null ? (t.memoizedState = e) : Tc(t, Z.memoizedState, e);
		},
		useTransition: function () {
			var e = hi(cr)[0],
				t = ze().memoizedState;
			return [e, t];
		},
		useMutableSource: mc,
		useSyncExternalStore: hc,
		useId: Lc,
		unstable_isNewReconciler: !1,
	};
function Sn(e, t) {
	try {
		var n = '',
			r = t;
		do ((n += ld(r)), (r = r.return));
		while (r);
		var l = n;
	} catch (i) {
		l =
			`
Error generating stack: ` +
			i.message +
			`
` +
			i.stack;
	}
	return { value: e, source: t, stack: l, digest: null };
}
function vi(e, t, n) {
	return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function lo(e, t) {
	try {
		console.error(t.value);
	} catch (n) {
		setTimeout(function () {
			throw n;
		});
	}
}
var Op = typeof WeakMap == 'function' ? WeakMap : Map;
function Rc(e, t, n) {
	((n = Ze(-1, n)), (n.tag = 3), (n.payload = { element: null }));
	var r = t.value;
	return (
		(n.callback = function () {
			(El || ((El = !0), (ho = r)), lo(e, t));
		}),
		n
	);
}
function jc(e, t, n) {
	((n = Ze(-1, n)), (n.tag = 3));
	var r = e.type.getDerivedStateFromError;
	if (typeof r == 'function') {
		var l = t.value;
		((n.payload = function () {
			return r(l);
		}),
			(n.callback = function () {
				lo(e, t);
			}));
	}
	var i = e.stateNode;
	return (
		i !== null &&
			typeof i.componentDidCatch == 'function' &&
			(n.callback = function () {
				(lo(e, t), typeof r != 'function' && (gt === null ? (gt = new Set([this])) : gt.add(this)));
				var o = t.stack;
				this.componentDidCatch(t.value, { componentStack: o !== null ? o : '' });
			}),
		n
	);
}
function ps(e, t, n) {
	var r = e.pingCache;
	if (r === null) {
		r = e.pingCache = new Op();
		var l = new Set();
		r.set(t, l);
	} else ((l = r.get(t)), l === void 0 && ((l = new Set()), r.set(t, l)));
	l.has(n) || (l.add(n), (e = Qp.bind(null, e, t, n)), t.then(e, e));
}
function ms(e) {
	do {
		var t;
		if (((t = e.tag === 13) && ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)), t)) return e;
		e = e.return;
	} while (e !== null);
	return null;
}
function hs(e, t, n, r, l) {
	return e.mode & 1
		? ((e.flags |= 65536), (e.lanes = l), e)
		: (e === t
				? (e.flags |= 65536)
				: ((e.flags |= 128),
					(n.flags |= 131072),
					(n.flags &= -52805),
					n.tag === 1 && (n.alternate === null ? (n.tag = 17) : ((t = Ze(-1, 1)), (t.tag = 2), vt(n, t, 1))),
					(n.lanes |= 1)),
			e);
}
var Mp = nt.ReactCurrentOwner,
	me = !1;
function ue(e, t, n, r) {
	t.child = e === null ? dc(t, null, n, r) : xn(t, e.child, n, r);
}
function vs(e, t, n, r, l) {
	n = n.render;
	var i = t.ref;
	return (
		hn(t, l),
		(r = ra(e, t, n, r, i, l)),
		(n = la()),
		e !== null && !me
			? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~l), tt(e, t, l))
			: (B && n && Qo(t), (t.flags |= 1), ue(e, t, r, l), t.child)
	);
}
function gs(e, t, n, r, l) {
	if (e === null) {
		var i = n.type;
		return typeof i == 'function' &&
			!ma(i) &&
			i.defaultProps === void 0 &&
			n.compare === null &&
			n.defaultProps === void 0
			? ((t.tag = 15), (t.type = i), Dc(e, t, i, r, l))
			: ((e = el(n.type, null, r, t, t.mode, l)), (e.ref = t.ref), (e.return = t), (t.child = e));
	}
	if (((i = e.child), !(e.lanes & l))) {
		var o = i.memoizedProps;
		if (((n = n.compare), (n = n !== null ? n : rr), n(o, r) && e.ref === t.ref)) return tt(e, t, l);
	}
	return ((t.flags |= 1), (e = wt(i, r)), (e.ref = t.ref), (e.return = t), (t.child = e));
}
function Dc(e, t, n, r, l) {
	if (e !== null) {
		var i = e.memoizedProps;
		if (rr(i, r) && e.ref === t.ref)
			if (((me = !1), (t.pendingProps = r = i), (e.lanes & l) !== 0)) e.flags & 131072 && (me = !0);
			else return ((t.lanes = e.lanes), tt(e, t, l));
	}
	return io(e, t, n, r, l);
}
function Fc(e, t, n) {
	var r = t.pendingProps,
		l = r.children,
		i = e !== null ? e.memoizedState : null;
	if (r.mode === 'hidden')
		if (!(t.mode & 1))
			((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }), $(cn, ye), (ye |= n));
		else {
			if (!(n & 1073741824))
				return (
					(e = i !== null ? i.baseLanes | n : n),
					(t.lanes = t.childLanes = 1073741824),
					(t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
					(t.updateQueue = null),
					$(cn, ye),
					(ye |= e),
					null
				);
			((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
				(r = i !== null ? i.baseLanes : n),
				$(cn, ye),
				(ye |= r));
		}
	else (i !== null ? ((r = i.baseLanes | n), (t.memoizedState = null)) : (r = n), $(cn, ye), (ye |= r));
	return (ue(e, t, l, n), t.child);
}
function Ic(e, t) {
	var n = t.ref;
	((e === null && n !== null) || (e !== null && e.ref !== n)) && ((t.flags |= 512), (t.flags |= 2097152));
}
function io(e, t, n, r, l) {
	var i = ve(n) ? Bt : se.current;
	return (
		(i = yn(t, i)),
		hn(t, l),
		(n = ra(e, t, n, r, i, l)),
		(r = la()),
		e !== null && !me
			? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~l), tt(e, t, l))
			: (B && r && Qo(t), (t.flags |= 1), ue(e, t, n, l), t.child)
	);
}
function ys(e, t, n, r, l) {
	if (ve(n)) {
		var i = !0;
		pl(t);
	} else i = !1;
	if ((hn(t, l), t.stateNode === null)) (Zr(e, t), cc(t, n, r), ro(t, n, r, l), (r = !0));
	else if (e === null) {
		var o = t.stateNode,
			a = t.memoizedProps;
		o.props = a;
		var s = o.context,
			u = n.contextType;
		typeof u == 'object' && u !== null ? (u = Le(u)) : ((u = ve(n) ? Bt : se.current), (u = yn(t, u)));
		var m = n.getDerivedStateFromProps,
			v = typeof m == 'function' || typeof o.getSnapshotBeforeUpdate == 'function';
		(v ||
			(typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
				typeof o.componentWillReceiveProps != 'function') ||
			((a !== r || s !== u) && us(t, o, r, u)),
			(ot = !1));
		var h = t.memoizedState;
		((o.state = h),
			yl(t, r, o, l),
			(s = t.memoizedState),
			a !== r || h !== s || he.current || ot
				? (typeof m == 'function' && (no(t, n, m, r), (s = t.memoizedState)),
					(a = ot || ss(t, n, a, r, h, s, u))
						? (v ||
								(typeof o.UNSAFE_componentWillMount != 'function' &&
									typeof o.componentWillMount != 'function') ||
								(typeof o.componentWillMount == 'function' && o.componentWillMount(),
								typeof o.UNSAFE_componentWillMount == 'function' && o.UNSAFE_componentWillMount()),
							typeof o.componentDidMount == 'function' && (t.flags |= 4194308))
						: (typeof o.componentDidMount == 'function' && (t.flags |= 4194308),
							(t.memoizedProps = r),
							(t.memoizedState = s)),
					(o.props = r),
					(o.state = s),
					(o.context = u),
					(r = a))
				: (typeof o.componentDidMount == 'function' && (t.flags |= 4194308), (r = !1)));
	} else {
		((o = t.stateNode),
			sc(e, t),
			(a = t.memoizedProps),
			(u = t.type === t.elementType ? a : Me(t.type, a)),
			(o.props = u),
			(v = t.pendingProps),
			(h = o.context),
			(s = n.contextType),
			typeof s == 'object' && s !== null ? (s = Le(s)) : ((s = ve(n) ? Bt : se.current), (s = yn(t, s))));
		var w = n.getDerivedStateFromProps;
		((m = typeof w == 'function' || typeof o.getSnapshotBeforeUpdate == 'function') ||
			(typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
				typeof o.componentWillReceiveProps != 'function') ||
			((a !== v || h !== s) && us(t, o, r, s)),
			(ot = !1),
			(h = t.memoizedState),
			(o.state = h),
			yl(t, r, o, l));
		var C = t.memoizedState;
		a !== v || h !== C || he.current || ot
			? (typeof w == 'function' && (no(t, n, w, r), (C = t.memoizedState)),
				(u = ot || ss(t, n, u, r, h, C, s) || !1)
					? (m ||
							(typeof o.UNSAFE_componentWillUpdate != 'function' &&
								typeof o.componentWillUpdate != 'function') ||
							(typeof o.componentWillUpdate == 'function' && o.componentWillUpdate(r, C, s),
							typeof o.UNSAFE_componentWillUpdate == 'function' && o.UNSAFE_componentWillUpdate(r, C, s)),
						typeof o.componentDidUpdate == 'function' && (t.flags |= 4),
						typeof o.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
					: (typeof o.componentDidUpdate != 'function' ||
							(a === e.memoizedProps && h === e.memoizedState) ||
							(t.flags |= 4),
						typeof o.getSnapshotBeforeUpdate != 'function' ||
							(a === e.memoizedProps && h === e.memoizedState) ||
							(t.flags |= 1024),
						(t.memoizedProps = r),
						(t.memoizedState = C)),
				(o.props = r),
				(o.state = C),
				(o.context = s),
				(r = u))
			: (typeof o.componentDidUpdate != 'function' ||
					(a === e.memoizedProps && h === e.memoizedState) ||
					(t.flags |= 4),
				typeof o.getSnapshotBeforeUpdate != 'function' ||
					(a === e.memoizedProps && h === e.memoizedState) ||
					(t.flags |= 1024),
				(r = !1));
	}
	return oo(e, t, n, r, i, l);
}
function oo(e, t, n, r, l, i) {
	Ic(e, t);
	var o = (t.flags & 128) !== 0;
	if (!r && !o) return (l && rs(t, n, !1), tt(e, t, i));
	((r = t.stateNode), (Mp.current = t));
	var a = o && typeof n.getDerivedStateFromError != 'function' ? null : r.render();
	return (
		(t.flags |= 1),
		e !== null && o ? ((t.child = xn(t, e.child, null, i)), (t.child = xn(t, null, a, i))) : ue(e, t, a, i),
		(t.memoizedState = r.state),
		l && rs(t, n, !0),
		t.child
	);
}
function $c(e) {
	var t = e.stateNode;
	(t.pendingContext ? ns(e, t.pendingContext, t.pendingContext !== t.context) : t.context && ns(e, t.context, !1),
		bo(e, t.containerInfo));
}
function ws(e, t, n, r, l) {
	return (wn(), Yo(l), (t.flags |= 256), ue(e, t, n, r), t.child);
}
var ao = { dehydrated: null, treeContext: null, retryLane: 0 };
function so(e) {
	return { baseLanes: e, cachePool: null, transitions: null };
}
function Ac(e, t, n) {
	var r = t.pendingProps,
		l = H.current,
		i = !1,
		o = (t.flags & 128) !== 0,
		a;
	if (
		((a = o) || (a = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0),
		a ? ((i = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (l |= 1),
		$(H, l & 1),
		e === null)
	)
		return (
			eo(t),
			(e = t.memoizedState),
			e !== null && ((e = e.dehydrated), e !== null)
				? (t.mode & 1 ? (e.data === '$!' ? (t.lanes = 8) : (t.lanes = 1073741824)) : (t.lanes = 1), null)
				: ((o = r.children),
					(e = r.fallback),
					i
						? ((r = t.mode),
							(i = t.child),
							(o = { mode: 'hidden', children: o }),
							!(r & 1) && i !== null
								? ((i.childLanes = 0), (i.pendingProps = o))
								: (i = Al(o, r, 0, null)),
							(e = Ut(e, r, n, null)),
							(i.return = t),
							(e.return = t),
							(i.sibling = e),
							(t.child = i),
							(t.child.memoizedState = so(n)),
							(t.memoizedState = ao),
							e)
						: aa(t, o))
		);
	if (((l = e.memoizedState), l !== null && ((a = l.dehydrated), a !== null))) return Rp(e, t, o, r, a, l, n);
	if (i) {
		((i = r.fallback), (o = t.mode), (l = e.child), (a = l.sibling));
		var s = { mode: 'hidden', children: r.children };
		return (
			!(o & 1) && t.child !== l
				? ((r = t.child), (r.childLanes = 0), (r.pendingProps = s), (t.deletions = null))
				: ((r = wt(l, s)), (r.subtreeFlags = l.subtreeFlags & 14680064)),
			a !== null ? (i = wt(a, i)) : ((i = Ut(i, o, n, null)), (i.flags |= 2)),
			(i.return = t),
			(r.return = t),
			(r.sibling = i),
			(t.child = r),
			(r = i),
			(i = t.child),
			(o = e.child.memoizedState),
			(o = o === null ? so(n) : { baseLanes: o.baseLanes | n, cachePool: null, transitions: o.transitions }),
			(i.memoizedState = o),
			(i.childLanes = e.childLanes & ~n),
			(t.memoizedState = ao),
			r
		);
	}
	return (
		(i = e.child),
		(e = i.sibling),
		(r = wt(i, { mode: 'visible', children: r.children })),
		!(t.mode & 1) && (r.lanes = n),
		(r.return = t),
		(r.sibling = null),
		e !== null && ((n = t.deletions), n === null ? ((t.deletions = [e]), (t.flags |= 16)) : n.push(e)),
		(t.child = r),
		(t.memoizedState = null),
		r
	);
}
function aa(e, t) {
	return ((t = Al({ mode: 'visible', children: t }, e.mode, 0, null)), (t.return = e), (e.child = t));
}
function Ir(e, t, n, r) {
	return (
		r !== null && Yo(r),
		xn(t, e.child, null, n),
		(e = aa(t, t.pendingProps.children)),
		(e.flags |= 2),
		(t.memoizedState = null),
		e
	);
}
function Rp(e, t, n, r, l, i, o) {
	if (n)
		return t.flags & 256
			? ((t.flags &= -257), (r = vi(Error(S(422)))), Ir(e, t, o, r))
			: t.memoizedState !== null
				? ((t.child = e.child), (t.flags |= 128), null)
				: ((i = r.fallback),
					(l = t.mode),
					(r = Al({ mode: 'visible', children: r.children }, l, 0, null)),
					(i = Ut(i, l, o, null)),
					(i.flags |= 2),
					(r.return = t),
					(i.return = t),
					(r.sibling = i),
					(t.child = r),
					t.mode & 1 && xn(t, e.child, null, o),
					(t.child.memoizedState = so(o)),
					(t.memoizedState = ao),
					i);
	if (!(t.mode & 1)) return Ir(e, t, o, null);
	if (l.data === '$!') {
		if (((r = l.nextSibling && l.nextSibling.dataset), r)) var a = r.dgst;
		return ((r = a), (i = Error(S(419))), (r = vi(i, r, void 0)), Ir(e, t, o, r));
	}
	if (((a = (o & e.childLanes) !== 0), me || a)) {
		if (((r = te), r !== null)) {
			switch (o & -o) {
				case 4:
					l = 2;
					break;
				case 16:
					l = 8;
					break;
				case 64:
				case 128:
				case 256:
				case 512:
				case 1024:
				case 2048:
				case 4096:
				case 8192:
				case 16384:
				case 32768:
				case 65536:
				case 131072:
				case 262144:
				case 524288:
				case 1048576:
				case 2097152:
				case 4194304:
				case 8388608:
				case 16777216:
				case 33554432:
				case 67108864:
					l = 32;
					break;
				case 536870912:
					l = 268435456;
					break;
				default:
					l = 0;
			}
			((l = l & (r.suspendedLanes | o) ? 0 : l),
				l !== 0 && l !== i.retryLane && ((i.retryLane = l), et(e, l), Fe(r, e, l, -1)));
		}
		return (pa(), (r = vi(Error(S(421)))), Ir(e, t, o, r));
	}
	return l.data === '$?'
		? ((t.flags |= 128), (t.child = e.child), (t = Kp.bind(null, e)), (l._reactRetry = t), null)
		: ((e = i.treeContext),
			(we = ht(l.nextSibling)),
			(xe = t),
			(B = !0),
			(je = null),
			e !== null && ((Ne[_e++] = Xe), (Ne[_e++] = qe), (Ne[_e++] = Wt), (Xe = e.id), (qe = e.overflow), (Wt = t)),
			(t = aa(t, r.children)),
			(t.flags |= 4096),
			t);
}
function xs(e, t, n) {
	e.lanes |= t;
	var r = e.alternate;
	(r !== null && (r.lanes |= t), to(e.return, t, n));
}
function gi(e, t, n, r, l) {
	var i = e.memoizedState;
	i === null
		? (e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: l })
		: ((i.isBackwards = t),
			(i.rendering = null),
			(i.renderingStartTime = 0),
			(i.last = r),
			(i.tail = n),
			(i.tailMode = l));
}
function Uc(e, t, n) {
	var r = t.pendingProps,
		l = r.revealOrder,
		i = r.tail;
	if ((ue(e, t, r.children, n), (r = H.current), r & 2)) ((r = (r & 1) | 2), (t.flags |= 128));
	else {
		if (e !== null && e.flags & 128)
			e: for (e = t.child; e !== null; ) {
				if (e.tag === 13) e.memoizedState !== null && xs(e, n, t);
				else if (e.tag === 19) xs(e, n, t);
				else if (e.child !== null) {
					((e.child.return = e), (e = e.child));
					continue;
				}
				if (e === t) break e;
				for (; e.sibling === null; ) {
					if (e.return === null || e.return === t) break e;
					e = e.return;
				}
				((e.sibling.return = e.return), (e = e.sibling));
			}
		r &= 1;
	}
	if (($(H, r), !(t.mode & 1))) t.memoizedState = null;
	else
		switch (l) {
			case 'forwards':
				for (n = t.child, l = null; n !== null; )
					((e = n.alternate), e !== null && wl(e) === null && (l = n), (n = n.sibling));
				((n = l),
					n === null ? ((l = t.child), (t.child = null)) : ((l = n.sibling), (n.sibling = null)),
					gi(t, !1, l, n, i));
				break;
			case 'backwards':
				for (n = null, l = t.child, t.child = null; l !== null; ) {
					if (((e = l.alternate), e !== null && wl(e) === null)) {
						t.child = l;
						break;
					}
					((e = l.sibling), (l.sibling = n), (n = l), (l = e));
				}
				gi(t, !0, n, null, i);
				break;
			case 'together':
				gi(t, !1, null, null, void 0);
				break;
			default:
				t.memoizedState = null;
		}
	return t.child;
}
function Zr(e, t) {
	!(t.mode & 1) && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function tt(e, t, n) {
	if ((e !== null && (t.dependencies = e.dependencies), (Vt |= t.lanes), !(n & t.childLanes))) return null;
	if (e !== null && t.child !== e.child) throw Error(S(153));
	if (t.child !== null) {
		for (e = t.child, n = wt(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; )
			((e = e.sibling), (n = n.sibling = wt(e, e.pendingProps)), (n.return = t));
		n.sibling = null;
	}
	return t.child;
}
function jp(e, t, n) {
	switch (t.tag) {
		case 3:
			($c(t), wn());
			break;
		case 5:
			pc(t);
			break;
		case 1:
			ve(t.type) && pl(t);
			break;
		case 4:
			bo(t, t.stateNode.containerInfo);
			break;
		case 10:
			var r = t.type._context,
				l = t.memoizedProps.value;
			($(vl, r._currentValue), (r._currentValue = l));
			break;
		case 13:
			if (((r = t.memoizedState), r !== null))
				return r.dehydrated !== null
					? ($(H, H.current & 1), (t.flags |= 128), null)
					: n & t.child.childLanes
						? Ac(e, t, n)
						: ($(H, H.current & 1), (e = tt(e, t, n)), e !== null ? e.sibling : null);
			$(H, H.current & 1);
			break;
		case 19:
			if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
				if (r) return Uc(e, t, n);
				t.flags |= 128;
			}
			if (
				((l = t.memoizedState),
				l !== null && ((l.rendering = null), (l.tail = null), (l.lastEffect = null)),
				$(H, H.current),
				r)
			)
				break;
			return null;
		case 22:
		case 23:
			return ((t.lanes = 0), Fc(e, t, n));
	}
	return tt(e, t, n);
}
var Bc, uo, Wc, Hc;
Bc = function (e, t) {
	for (var n = t.child; n !== null; ) {
		if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
		else if (n.tag !== 4 && n.child !== null) {
			((n.child.return = n), (n = n.child));
			continue;
		}
		if (n === t) break;
		for (; n.sibling === null; ) {
			if (n.return === null || n.return === t) return;
			n = n.return;
		}
		((n.sibling.return = n.return), (n = n.sibling));
	}
};
uo = function () {};
Wc = function (e, t, n, r) {
	var l = e.memoizedProps;
	if (l !== r) {
		((e = t.stateNode), It(He.current));
		var i = null;
		switch (n) {
			case 'input':
				((l = Oi(e, l)), (r = Oi(e, r)), (i = []));
				break;
			case 'select':
				((l = Q({}, l, { value: void 0 })), (r = Q({}, r, { value: void 0 })), (i = []));
				break;
			case 'textarea':
				((l = ji(e, l)), (r = ji(e, r)), (i = []));
				break;
			default:
				typeof l.onClick != 'function' && typeof r.onClick == 'function' && (e.onclick = fl);
		}
		Fi(n, r);
		var o;
		n = null;
		for (u in l)
			if (!r.hasOwnProperty(u) && l.hasOwnProperty(u) && l[u] != null)
				if (u === 'style') {
					var a = l[u];
					for (o in a) a.hasOwnProperty(o) && (n || (n = {}), (n[o] = ''));
				} else
					u !== 'dangerouslySetInnerHTML' &&
						u !== 'children' &&
						u !== 'suppressContentEditableWarning' &&
						u !== 'suppressHydrationWarning' &&
						u !== 'autoFocus' &&
						(qn.hasOwnProperty(u) ? i || (i = []) : (i = i || []).push(u, null));
		for (u in r) {
			var s = r[u];
			if (((a = l != null ? l[u] : void 0), r.hasOwnProperty(u) && s !== a && (s != null || a != null)))
				if (u === 'style')
					if (a) {
						for (o in a) !a.hasOwnProperty(o) || (s && s.hasOwnProperty(o)) || (n || (n = {}), (n[o] = ''));
						for (o in s) s.hasOwnProperty(o) && a[o] !== s[o] && (n || (n = {}), (n[o] = s[o]));
					} else (n || (i || (i = []), i.push(u, n)), (n = s));
				else
					u === 'dangerouslySetInnerHTML'
						? ((s = s ? s.__html : void 0),
							(a = a ? a.__html : void 0),
							s != null && a !== s && (i = i || []).push(u, s))
						: u === 'children'
							? (typeof s != 'string' && typeof s != 'number') || (i = i || []).push(u, '' + s)
							: u !== 'suppressContentEditableWarning' &&
								u !== 'suppressHydrationWarning' &&
								(qn.hasOwnProperty(u)
									? (s != null && u === 'onScroll' && A('scroll', e), i || a === s || (i = []))
									: (i = i || []).push(u, s));
		}
		n && (i = i || []).push('style', n);
		var u = i;
		(t.updateQueue = u) && (t.flags |= 4);
	}
};
Hc = function (e, t, n, r) {
	n !== r && (t.flags |= 4);
};
function Rn(e, t) {
	if (!B)
		switch (e.tailMode) {
			case 'hidden':
				t = e.tail;
				for (var n = null; t !== null; ) (t.alternate !== null && (n = t), (t = t.sibling));
				n === null ? (e.tail = null) : (n.sibling = null);
				break;
			case 'collapsed':
				n = e.tail;
				for (var r = null; n !== null; ) (n.alternate !== null && (r = n), (n = n.sibling));
				r === null ? (t || e.tail === null ? (e.tail = null) : (e.tail.sibling = null)) : (r.sibling = null);
		}
}
function oe(e) {
	var t = e.alternate !== null && e.alternate.child === e.child,
		n = 0,
		r = 0;
	if (t)
		for (var l = e.child; l !== null; )
			((n |= l.lanes | l.childLanes),
				(r |= l.subtreeFlags & 14680064),
				(r |= l.flags & 14680064),
				(l.return = e),
				(l = l.sibling));
	else
		for (l = e.child; l !== null; )
			((n |= l.lanes | l.childLanes), (r |= l.subtreeFlags), (r |= l.flags), (l.return = e), (l = l.sibling));
	return ((e.subtreeFlags |= r), (e.childLanes = n), t);
}
function Dp(e, t, n) {
	var r = t.pendingProps;
	switch ((Ko(t), t.tag)) {
		case 2:
		case 16:
		case 15:
		case 0:
		case 11:
		case 7:
		case 8:
		case 12:
		case 9:
		case 14:
			return (oe(t), null);
		case 1:
			return (ve(t.type) && dl(), oe(t), null);
		case 3:
			return (
				(r = t.stateNode),
				kn(),
				U(he),
				U(se),
				ta(),
				r.pendingContext && ((r.context = r.pendingContext), (r.pendingContext = null)),
				(e === null || e.child === null) &&
					(Dr(t)
						? (t.flags |= 4)
						: e === null ||
							(e.memoizedState.isDehydrated && !(t.flags & 256)) ||
							((t.flags |= 1024), je !== null && (yo(je), (je = null)))),
				uo(e, t),
				oe(t),
				null
			);
		case 5:
			ea(t);
			var l = It(sr.current);
			if (((n = t.type), e !== null && t.stateNode != null))
				(Wc(e, t, n, r, l), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
			else {
				if (!r) {
					if (t.stateNode === null) throw Error(S(166));
					return (oe(t), null);
				}
				if (((e = It(He.current)), Dr(t))) {
					((r = t.stateNode), (n = t.type));
					var i = t.memoizedProps;
					switch (((r[Ue] = t), (r[or] = i), (e = (t.mode & 1) !== 0), n)) {
						case 'dialog':
							(A('cancel', r), A('close', r));
							break;
						case 'iframe':
						case 'object':
						case 'embed':
							A('load', r);
							break;
						case 'video':
						case 'audio':
							for (l = 0; l < $n.length; l++) A($n[l], r);
							break;
						case 'source':
							A('error', r);
							break;
						case 'img':
						case 'image':
						case 'link':
							(A('error', r), A('load', r));
							break;
						case 'details':
							A('toggle', r);
							break;
						case 'input':
							(La(r, i), A('invalid', r));
							break;
						case 'select':
							((r._wrapperState = { wasMultiple: !!i.multiple }), A('invalid', r));
							break;
						case 'textarea':
							(Oa(r, i), A('invalid', r));
					}
					(Fi(n, i), (l = null));
					for (var o in i)
						if (i.hasOwnProperty(o)) {
							var a = i[o];
							o === 'children'
								? typeof a == 'string'
									? r.textContent !== a &&
										(i.suppressHydrationWarning !== !0 && jr(r.textContent, a, e),
										(l = ['children', a]))
									: typeof a == 'number' &&
										r.textContent !== '' + a &&
										(i.suppressHydrationWarning !== !0 && jr(r.textContent, a, e),
										(l = ['children', '' + a]))
								: qn.hasOwnProperty(o) && a != null && o === 'onScroll' && A('scroll', r);
						}
					switch (n) {
						case 'input':
							(_r(r), za(r, i, !0));
							break;
						case 'textarea':
							(_r(r), Ma(r));
							break;
						case 'select':
						case 'option':
							break;
						default:
							typeof i.onClick == 'function' && (r.onclick = fl);
					}
					((r = l), (t.updateQueue = r), r !== null && (t.flags |= 4));
				} else {
					((o = l.nodeType === 9 ? l : l.ownerDocument),
						e === 'http://www.w3.org/1999/xhtml' && (e = vu(n)),
						e === 'http://www.w3.org/1999/xhtml'
							? n === 'script'
								? ((e = o.createElement('div')),
									(e.innerHTML = '<script><\/script>'),
									(e = e.removeChild(e.firstChild)))
								: typeof r.is == 'string'
									? (e = o.createElement(n, { is: r.is }))
									: ((e = o.createElement(n)),
										n === 'select' &&
											((o = e), r.multiple ? (o.multiple = !0) : r.size && (o.size = r.size)))
							: (e = o.createElementNS(e, n)),
						(e[Ue] = t),
						(e[or] = r),
						Bc(e, t, !1, !1),
						(t.stateNode = e));
					e: {
						switch (((o = Ii(n, r)), n)) {
							case 'dialog':
								(A('cancel', e), A('close', e), (l = r));
								break;
							case 'iframe':
							case 'object':
							case 'embed':
								(A('load', e), (l = r));
								break;
							case 'video':
							case 'audio':
								for (l = 0; l < $n.length; l++) A($n[l], e);
								l = r;
								break;
							case 'source':
								(A('error', e), (l = r));
								break;
							case 'img':
							case 'image':
							case 'link':
								(A('error', e), A('load', e), (l = r));
								break;
							case 'details':
								(A('toggle', e), (l = r));
								break;
							case 'input':
								(La(e, r), (l = Oi(e, r)), A('invalid', e));
								break;
							case 'option':
								l = r;
								break;
							case 'select':
								((e._wrapperState = { wasMultiple: !!r.multiple }),
									(l = Q({}, r, { value: void 0 })),
									A('invalid', e));
								break;
							case 'textarea':
								(Oa(e, r), (l = ji(e, r)), A('invalid', e));
								break;
							default:
								l = r;
						}
						(Fi(n, l), (a = l));
						for (i in a)
							if (a.hasOwnProperty(i)) {
								var s = a[i];
								i === 'style'
									? wu(e, s)
									: i === 'dangerouslySetInnerHTML'
										? ((s = s ? s.__html : void 0), s != null && gu(e, s))
										: i === 'children'
											? typeof s == 'string'
												? (n !== 'textarea' || s !== '') && Zn(e, s)
												: typeof s == 'number' && Zn(e, '' + s)
											: i !== 'suppressContentEditableWarning' &&
												i !== 'suppressHydrationWarning' &&
												i !== 'autoFocus' &&
												(qn.hasOwnProperty(i)
													? s != null && i === 'onScroll' && A('scroll', e)
													: s != null && Oo(e, i, s, o));
							}
						switch (n) {
							case 'input':
								(_r(e), za(e, r, !1));
								break;
							case 'textarea':
								(_r(e), Ma(e));
								break;
							case 'option':
								r.value != null && e.setAttribute('value', '' + St(r.value));
								break;
							case 'select':
								((e.multiple = !!r.multiple),
									(i = r.value),
									i != null
										? fn(e, !!r.multiple, i, !1)
										: r.defaultValue != null && fn(e, !!r.multiple, r.defaultValue, !0));
								break;
							default:
								typeof l.onClick == 'function' && (e.onclick = fl);
						}
						switch (n) {
							case 'button':
							case 'input':
							case 'select':
							case 'textarea':
								r = !!r.autoFocus;
								break e;
							case 'img':
								r = !0;
								break e;
							default:
								r = !1;
						}
					}
					r && (t.flags |= 4);
				}
				t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
			}
			return (oe(t), null);
		case 6:
			if (e && t.stateNode != null) Hc(e, t, e.memoizedProps, r);
			else {
				if (typeof r != 'string' && t.stateNode === null) throw Error(S(166));
				if (((n = It(sr.current)), It(He.current), Dr(t))) {
					if (
						((r = t.stateNode),
						(n = t.memoizedProps),
						(r[Ue] = t),
						(i = r.nodeValue !== n) && ((e = xe), e !== null))
					)
						switch (e.tag) {
							case 3:
								jr(r.nodeValue, n, (e.mode & 1) !== 0);
								break;
							case 5:
								e.memoizedProps.suppressHydrationWarning !== !0 &&
									jr(r.nodeValue, n, (e.mode & 1) !== 0);
						}
					i && (t.flags |= 4);
				} else
					((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)), (r[Ue] = t), (t.stateNode = r));
			}
			return (oe(t), null);
		case 13:
			if (
				(U(H),
				(r = t.memoizedState),
				e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
			) {
				if (B && we !== null && t.mode & 1 && !(t.flags & 128)) (oc(), wn(), (t.flags |= 98560), (i = !1));
				else if (((i = Dr(t)), r !== null && r.dehydrated !== null)) {
					if (e === null) {
						if (!i) throw Error(S(318));
						if (((i = t.memoizedState), (i = i !== null ? i.dehydrated : null), !i)) throw Error(S(317));
						i[Ue] = t;
					} else (wn(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
					(oe(t), (i = !1));
				} else (je !== null && (yo(je), (je = null)), (i = !0));
				if (!i) return t.flags & 65536 ? t : null;
			}
			return t.flags & 128
				? ((t.lanes = n), t)
				: ((r = r !== null),
					r !== (e !== null && e.memoizedState !== null) &&
						r &&
						((t.child.flags |= 8192),
						t.mode & 1 && (e === null || H.current & 1 ? J === 0 && (J = 3) : pa())),
					t.updateQueue !== null && (t.flags |= 4),
					oe(t),
					null);
		case 4:
			return (kn(), uo(e, t), e === null && lr(t.stateNode.containerInfo), oe(t), null);
		case 10:
			return (qo(t.type._context), oe(t), null);
		case 17:
			return (ve(t.type) && dl(), oe(t), null);
		case 19:
			if ((U(H), (i = t.memoizedState), i === null)) return (oe(t), null);
			if (((r = (t.flags & 128) !== 0), (o = i.rendering), o === null))
				if (r) Rn(i, !1);
				else {
					if (J !== 0 || (e !== null && e.flags & 128))
						for (e = t.child; e !== null; ) {
							if (((o = wl(e)), o !== null)) {
								for (
									t.flags |= 128,
										Rn(i, !1),
										r = o.updateQueue,
										r !== null && ((t.updateQueue = r), (t.flags |= 4)),
										t.subtreeFlags = 0,
										r = n,
										n = t.child;
									n !== null;

								)
									((i = n),
										(e = r),
										(i.flags &= 14680066),
										(o = i.alternate),
										o === null
											? ((i.childLanes = 0),
												(i.lanes = e),
												(i.child = null),
												(i.subtreeFlags = 0),
												(i.memoizedProps = null),
												(i.memoizedState = null),
												(i.updateQueue = null),
												(i.dependencies = null),
												(i.stateNode = null))
											: ((i.childLanes = o.childLanes),
												(i.lanes = o.lanes),
												(i.child = o.child),
												(i.subtreeFlags = 0),
												(i.deletions = null),
												(i.memoizedProps = o.memoizedProps),
												(i.memoizedState = o.memoizedState),
												(i.updateQueue = o.updateQueue),
												(i.type = o.type),
												(e = o.dependencies),
												(i.dependencies =
													e === null
														? null
														: { lanes: e.lanes, firstContext: e.firstContext })),
										(n = n.sibling));
								return ($(H, (H.current & 1) | 2), t.child);
							}
							e = e.sibling;
						}
					i.tail !== null && X() > En && ((t.flags |= 128), (r = !0), Rn(i, !1), (t.lanes = 4194304));
				}
			else {
				if (!r)
					if (((e = wl(o)), e !== null)) {
						if (
							((t.flags |= 128),
							(r = !0),
							(n = e.updateQueue),
							n !== null && ((t.updateQueue = n), (t.flags |= 4)),
							Rn(i, !0),
							i.tail === null && i.tailMode === 'hidden' && !o.alternate && !B)
						)
							return (oe(t), null);
					} else
						2 * X() - i.renderingStartTime > En &&
							n !== 1073741824 &&
							((t.flags |= 128), (r = !0), Rn(i, !1), (t.lanes = 4194304));
				i.isBackwards
					? ((o.sibling = t.child), (t.child = o))
					: ((n = i.last), n !== null ? (n.sibling = o) : (t.child = o), (i.last = o));
			}
			return i.tail !== null
				? ((t = i.tail),
					(i.rendering = t),
					(i.tail = t.sibling),
					(i.renderingStartTime = X()),
					(t.sibling = null),
					(n = H.current),
					$(H, r ? (n & 1) | 2 : n & 1),
					t)
				: (oe(t), null);
		case 22:
		case 23:
			return (
				da(),
				(r = t.memoizedState !== null),
				e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
				r && t.mode & 1 ? ye & 1073741824 && (oe(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : oe(t),
				null
			);
		case 24:
			return null;
		case 25:
			return null;
	}
	throw Error(S(156, t.tag));
}
function Fp(e, t) {
	switch ((Ko(t), t.tag)) {
		case 1:
			return (ve(t.type) && dl(), (e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
		case 3:
			return (
				kn(),
				U(he),
				U(se),
				ta(),
				(e = t.flags),
				e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
			);
		case 5:
			return (ea(t), null);
		case 13:
			if ((U(H), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
				if (t.alternate === null) throw Error(S(340));
				wn();
			}
			return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
		case 19:
			return (U(H), null);
		case 4:
			return (kn(), null);
		case 10:
			return (qo(t.type._context), null);
		case 22:
		case 23:
			return (da(), null);
		case 24:
			return null;
		default:
			return null;
	}
}
var $r = !1,
	ae = !1,
	Ip = typeof WeakSet == 'function' ? WeakSet : Set,
	P = null;
function un(e, t) {
	var n = e.ref;
	if (n !== null)
		if (typeof n == 'function')
			try {
				n(null);
			} catch (r) {
				Y(e, t, r);
			}
		else n.current = null;
}
function co(e, t, n) {
	try {
		n();
	} catch (r) {
		Y(e, t, r);
	}
}
var ks = !1;
function $p(e, t) {
	if (((Yi = sl), (e = Yu()), Vo(e))) {
		if ('selectionStart' in e) var n = { start: e.selectionStart, end: e.selectionEnd };
		else
			e: {
				n = ((n = e.ownerDocument) && n.defaultView) || window;
				var r = n.getSelection && n.getSelection();
				if (r && r.rangeCount !== 0) {
					n = r.anchorNode;
					var l = r.anchorOffset,
						i = r.focusNode;
					r = r.focusOffset;
					try {
						(n.nodeType, i.nodeType);
					} catch {
						n = null;
						break e;
					}
					var o = 0,
						a = -1,
						s = -1,
						u = 0,
						m = 0,
						v = e,
						h = null;
					t: for (;;) {
						for (
							var w;
							v !== n || (l !== 0 && v.nodeType !== 3) || (a = o + l),
								v !== i || (r !== 0 && v.nodeType !== 3) || (s = o + r),
								v.nodeType === 3 && (o += v.nodeValue.length),
								(w = v.firstChild) !== null;

						)
							((h = v), (v = w));
						for (;;) {
							if (v === e) break t;
							if (
								(h === n && ++u === l && (a = o),
								h === i && ++m === r && (s = o),
								(w = v.nextSibling) !== null)
							)
								break;
							((v = h), (h = v.parentNode));
						}
						v = w;
					}
					n = a === -1 || s === -1 ? null : { start: a, end: s };
				} else n = null;
			}
		n = n || { start: 0, end: 0 };
	} else n = null;
	for (Gi = { focusedElem: e, selectionRange: n }, sl = !1, P = t; P !== null; )
		if (((t = P), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null)) ((e.return = t), (P = e));
		else
			for (; P !== null; ) {
				t = P;
				try {
					var C = t.alternate;
					if (t.flags & 1024)
						switch (t.tag) {
							case 0:
							case 11:
							case 15:
								break;
							case 1:
								if (C !== null) {
									var N = C.memoizedProps,
										j = C.memoizedState,
										f = t.stateNode,
										c = f.getSnapshotBeforeUpdate(t.elementType === t.type ? N : Me(t.type, N), j);
									f.__reactInternalSnapshotBeforeUpdate = c;
								}
								break;
							case 3:
								var p = t.stateNode.containerInfo;
								p.nodeType === 1
									? (p.textContent = '')
									: p.nodeType === 9 && p.documentElement && p.removeChild(p.documentElement);
								break;
							case 5:
							case 6:
							case 4:
							case 17:
								break;
							default:
								throw Error(S(163));
						}
				} catch (y) {
					Y(t, t.return, y);
				}
				if (((e = t.sibling), e !== null)) {
					((e.return = t.return), (P = e));
					break;
				}
				P = t.return;
			}
	return ((C = ks), (ks = !1), C);
}
function Kn(e, t, n) {
	var r = t.updateQueue;
	if (((r = r !== null ? r.lastEffect : null), r !== null)) {
		var l = (r = r.next);
		do {
			if ((l.tag & e) === e) {
				var i = l.destroy;
				((l.destroy = void 0), i !== void 0 && co(t, n, i));
			}
			l = l.next;
		} while (l !== r);
	}
}
function Il(e, t) {
	if (((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)) {
		var n = (t = t.next);
		do {
			if ((n.tag & e) === e) {
				var r = n.create;
				n.destroy = r();
			}
			n = n.next;
		} while (n !== t);
	}
}
function fo(e) {
	var t = e.ref;
	if (t !== null) {
		var n = e.stateNode;
		switch (e.tag) {
			case 5:
				e = n;
				break;
			default:
				e = n;
		}
		typeof t == 'function' ? t(e) : (t.current = e);
	}
}
function Vc(e) {
	var t = e.alternate;
	(t !== null && ((e.alternate = null), Vc(t)),
		(e.child = null),
		(e.deletions = null),
		(e.sibling = null),
		e.tag === 5 &&
			((t = e.stateNode), t !== null && (delete t[Ue], delete t[or], delete t[Zi], delete t[xp], delete t[kp])),
		(e.stateNode = null),
		(e.return = null),
		(e.dependencies = null),
		(e.memoizedProps = null),
		(e.memoizedState = null),
		(e.pendingProps = null),
		(e.stateNode = null),
		(e.updateQueue = null));
}
function Qc(e) {
	return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Ss(e) {
	e: for (;;) {
		for (; e.sibling === null; ) {
			if (e.return === null || Qc(e.return)) return null;
			e = e.return;
		}
		for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
			if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
			((e.child.return = e), (e = e.child));
		}
		if (!(e.flags & 2)) return e.stateNode;
	}
}
function po(e, t, n) {
	var r = e.tag;
	if (r === 5 || r === 6)
		((e = e.stateNode),
			t
				? n.nodeType === 8
					? n.parentNode.insertBefore(e, t)
					: n.insertBefore(e, t)
				: (n.nodeType === 8 ? ((t = n.parentNode), t.insertBefore(e, n)) : ((t = n), t.appendChild(e)),
					(n = n._reactRootContainer),
					n != null || t.onclick !== null || (t.onclick = fl)));
	else if (r !== 4 && ((e = e.child), e !== null))
		for (po(e, t, n), e = e.sibling; e !== null; ) (po(e, t, n), (e = e.sibling));
}
function mo(e, t, n) {
	var r = e.tag;
	if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
	else if (r !== 4 && ((e = e.child), e !== null))
		for (mo(e, t, n), e = e.sibling; e !== null; ) (mo(e, t, n), (e = e.sibling));
}
var ne = null,
	Re = !1;
function lt(e, t, n) {
	for (n = n.child; n !== null; ) (Kc(e, t, n), (n = n.sibling));
}
function Kc(e, t, n) {
	if (We && typeof We.onCommitFiberUnmount == 'function')
		try {
			We.onCommitFiberUnmount(Ll, n);
		} catch {}
	switch (n.tag) {
		case 5:
			ae || un(n, t);
		case 6:
			var r = ne,
				l = Re;
			((ne = null),
				lt(e, t, n),
				(ne = r),
				(Re = l),
				ne !== null &&
					(Re
						? ((e = ne),
							(n = n.stateNode),
							e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
						: ne.removeChild(n.stateNode)));
			break;
		case 18:
			ne !== null &&
				(Re
					? ((e = ne),
						(n = n.stateNode),
						e.nodeType === 8 ? ci(e.parentNode, n) : e.nodeType === 1 && ci(e, n),
						tr(e))
					: ci(ne, n.stateNode));
			break;
		case 4:
			((r = ne), (l = Re), (ne = n.stateNode.containerInfo), (Re = !0), lt(e, t, n), (ne = r), (Re = l));
			break;
		case 0:
		case 11:
		case 14:
		case 15:
			if (!ae && ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))) {
				l = r = r.next;
				do {
					var i = l,
						o = i.destroy;
					((i = i.tag), o !== void 0 && (i & 2 || i & 4) && co(n, t, o), (l = l.next));
				} while (l !== r);
			}
			lt(e, t, n);
			break;
		case 1:
			if (!ae && (un(n, t), (r = n.stateNode), typeof r.componentWillUnmount == 'function'))
				try {
					((r.props = n.memoizedProps), (r.state = n.memoizedState), r.componentWillUnmount());
				} catch (a) {
					Y(n, t, a);
				}
			lt(e, t, n);
			break;
		case 21:
			lt(e, t, n);
			break;
		case 22:
			n.mode & 1 ? ((ae = (r = ae) || n.memoizedState !== null), lt(e, t, n), (ae = r)) : lt(e, t, n);
			break;
		default:
			lt(e, t, n);
	}
}
function Es(e) {
	var t = e.updateQueue;
	if (t !== null) {
		e.updateQueue = null;
		var n = e.stateNode;
		(n === null && (n = e.stateNode = new Ip()),
			t.forEach(function (r) {
				var l = Yp.bind(null, e, r);
				n.has(r) || (n.add(r), r.then(l, l));
			}));
	}
}
function Oe(e, t) {
	var n = t.deletions;
	if (n !== null)
		for (var r = 0; r < n.length; r++) {
			var l = n[r];
			try {
				var i = e,
					o = t,
					a = o;
				e: for (; a !== null; ) {
					switch (a.tag) {
						case 5:
							((ne = a.stateNode), (Re = !1));
							break e;
						case 3:
							((ne = a.stateNode.containerInfo), (Re = !0));
							break e;
						case 4:
							((ne = a.stateNode.containerInfo), (Re = !0));
							break e;
					}
					a = a.return;
				}
				if (ne === null) throw Error(S(160));
				(Kc(i, o, l), (ne = null), (Re = !1));
				var s = l.alternate;
				(s !== null && (s.return = null), (l.return = null));
			} catch (u) {
				Y(l, t, u);
			}
		}
	if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) (Yc(t, e), (t = t.sibling));
}
function Yc(e, t) {
	var n = e.alternate,
		r = e.flags;
	switch (e.tag) {
		case 0:
		case 11:
		case 14:
		case 15:
			if ((Oe(t, e), $e(e), r & 4)) {
				try {
					(Kn(3, e, e.return), Il(3, e));
				} catch (N) {
					Y(e, e.return, N);
				}
				try {
					Kn(5, e, e.return);
				} catch (N) {
					Y(e, e.return, N);
				}
			}
			break;
		case 1:
			(Oe(t, e), $e(e), r & 512 && n !== null && un(n, n.return));
			break;
		case 5:
			if ((Oe(t, e), $e(e), r & 512 && n !== null && un(n, n.return), e.flags & 32)) {
				var l = e.stateNode;
				try {
					Zn(l, '');
				} catch (N) {
					Y(e, e.return, N);
				}
			}
			if (r & 4 && ((l = e.stateNode), l != null)) {
				var i = e.memoizedProps,
					o = n !== null ? n.memoizedProps : i,
					a = e.type,
					s = e.updateQueue;
				if (((e.updateQueue = null), s !== null))
					try {
						(a === 'input' && i.type === 'radio' && i.name != null && mu(l, i), Ii(a, o));
						var u = Ii(a, i);
						for (o = 0; o < s.length; o += 2) {
							var m = s[o],
								v = s[o + 1];
							m === 'style'
								? wu(l, v)
								: m === 'dangerouslySetInnerHTML'
									? gu(l, v)
									: m === 'children'
										? Zn(l, v)
										: Oo(l, m, v, u);
						}
						switch (a) {
							case 'input':
								Mi(l, i);
								break;
							case 'textarea':
								hu(l, i);
								break;
							case 'select':
								var h = l._wrapperState.wasMultiple;
								l._wrapperState.wasMultiple = !!i.multiple;
								var w = i.value;
								w != null
									? fn(l, !!i.multiple, w, !1)
									: h !== !!i.multiple &&
										(i.defaultValue != null
											? fn(l, !!i.multiple, i.defaultValue, !0)
											: fn(l, !!i.multiple, i.multiple ? [] : '', !1));
						}
						l[or] = i;
					} catch (N) {
						Y(e, e.return, N);
					}
			}
			break;
		case 6:
			if ((Oe(t, e), $e(e), r & 4)) {
				if (e.stateNode === null) throw Error(S(162));
				((l = e.stateNode), (i = e.memoizedProps));
				try {
					l.nodeValue = i;
				} catch (N) {
					Y(e, e.return, N);
				}
			}
			break;
		case 3:
			if ((Oe(t, e), $e(e), r & 4 && n !== null && n.memoizedState.isDehydrated))
				try {
					tr(t.containerInfo);
				} catch (N) {
					Y(e, e.return, N);
				}
			break;
		case 4:
			(Oe(t, e), $e(e));
			break;
		case 13:
			(Oe(t, e),
				$e(e),
				(l = e.child),
				l.flags & 8192 &&
					((i = l.memoizedState !== null),
					(l.stateNode.isHidden = i),
					!i || (l.alternate !== null && l.alternate.memoizedState !== null) || (ca = X())),
				r & 4 && Es(e));
			break;
		case 22:
			if (
				((m = n !== null && n.memoizedState !== null),
				e.mode & 1 ? ((ae = (u = ae) || m), Oe(t, e), (ae = u)) : Oe(t, e),
				$e(e),
				r & 8192)
			) {
				if (((u = e.memoizedState !== null), (e.stateNode.isHidden = u) && !m && e.mode & 1))
					for (P = e, m = e.child; m !== null; ) {
						for (v = P = m; P !== null; ) {
							switch (((h = P), (w = h.child), h.tag)) {
								case 0:
								case 11:
								case 14:
								case 15:
									Kn(4, h, h.return);
									break;
								case 1:
									un(h, h.return);
									var C = h.stateNode;
									if (typeof C.componentWillUnmount == 'function') {
										((r = h), (n = h.return));
										try {
											((t = r),
												(C.props = t.memoizedProps),
												(C.state = t.memoizedState),
												C.componentWillUnmount());
										} catch (N) {
											Y(r, n, N);
										}
									}
									break;
								case 5:
									un(h, h.return);
									break;
								case 22:
									if (h.memoizedState !== null) {
										Ns(v);
										continue;
									}
							}
							w !== null ? ((w.return = h), (P = w)) : Ns(v);
						}
						m = m.sibling;
					}
				e: for (m = null, v = e; ; ) {
					if (v.tag === 5) {
						if (m === null) {
							m = v;
							try {
								((l = v.stateNode),
									u
										? ((i = l.style),
											typeof i.setProperty == 'function'
												? i.setProperty('display', 'none', 'important')
												: (i.display = 'none'))
										: ((a = v.stateNode),
											(s = v.memoizedProps.style),
											(o = s != null && s.hasOwnProperty('display') ? s.display : null),
											(a.style.display = yu('display', o))));
							} catch (N) {
								Y(e, e.return, N);
							}
						}
					} else if (v.tag === 6) {
						if (m === null)
							try {
								v.stateNode.nodeValue = u ? '' : v.memoizedProps;
							} catch (N) {
								Y(e, e.return, N);
							}
					} else if (
						((v.tag !== 22 && v.tag !== 23) || v.memoizedState === null || v === e) &&
						v.child !== null
					) {
						((v.child.return = v), (v = v.child));
						continue;
					}
					if (v === e) break e;
					for (; v.sibling === null; ) {
						if (v.return === null || v.return === e) break e;
						(m === v && (m = null), (v = v.return));
					}
					(m === v && (m = null), (v.sibling.return = v.return), (v = v.sibling));
				}
			}
			break;
		case 19:
			(Oe(t, e), $e(e), r & 4 && Es(e));
			break;
		case 21:
			break;
		default:
			(Oe(t, e), $e(e));
	}
}
function $e(e) {
	var t = e.flags;
	if (t & 2) {
		try {
			e: {
				for (var n = e.return; n !== null; ) {
					if (Qc(n)) {
						var r = n;
						break e;
					}
					n = n.return;
				}
				throw Error(S(160));
			}
			switch (r.tag) {
				case 5:
					var l = r.stateNode;
					r.flags & 32 && (Zn(l, ''), (r.flags &= -33));
					var i = Ss(e);
					mo(e, i, l);
					break;
				case 3:
				case 4:
					var o = r.stateNode.containerInfo,
						a = Ss(e);
					po(e, a, o);
					break;
				default:
					throw Error(S(161));
			}
		} catch (s) {
			Y(e, e.return, s);
		}
		e.flags &= -3;
	}
	t & 4096 && (e.flags &= -4097);
}
function Ap(e, t, n) {
	((P = e), Gc(e));
}
function Gc(e, t, n) {
	for (var r = (e.mode & 1) !== 0; P !== null; ) {
		var l = P,
			i = l.child;
		if (l.tag === 22 && r) {
			var o = l.memoizedState !== null || $r;
			if (!o) {
				var a = l.alternate,
					s = (a !== null && a.memoizedState !== null) || ae;
				a = $r;
				var u = ae;
				if ((($r = o), (ae = s) && !u))
					for (P = l; P !== null; )
						((o = P),
							(s = o.child),
							o.tag === 22 && o.memoizedState !== null
								? _s(l)
								: s !== null
									? ((s.return = o), (P = s))
									: _s(l));
				for (; i !== null; ) ((P = i), Gc(i), (i = i.sibling));
				((P = l), ($r = a), (ae = u));
			}
			Cs(e);
		} else l.subtreeFlags & 8772 && i !== null ? ((i.return = l), (P = i)) : Cs(e);
	}
}
function Cs(e) {
	for (; P !== null; ) {
		var t = P;
		if (t.flags & 8772) {
			var n = t.alternate;
			try {
				if (t.flags & 8772)
					switch (t.tag) {
						case 0:
						case 11:
						case 15:
							ae || Il(5, t);
							break;
						case 1:
							var r = t.stateNode;
							if (t.flags & 4 && !ae)
								if (n === null) r.componentDidMount();
								else {
									var l = t.elementType === t.type ? n.memoizedProps : Me(t.type, n.memoizedProps);
									r.componentDidUpdate(l, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
								}
							var i = t.updateQueue;
							i !== null && as(t, i, r);
							break;
						case 3:
							var o = t.updateQueue;
							if (o !== null) {
								if (((n = null), t.child !== null))
									switch (t.child.tag) {
										case 5:
											n = t.child.stateNode;
											break;
										case 1:
											n = t.child.stateNode;
									}
								as(t, o, n);
							}
							break;
						case 5:
							var a = t.stateNode;
							if (n === null && t.flags & 4) {
								n = a;
								var s = t.memoizedProps;
								switch (t.type) {
									case 'button':
									case 'input':
									case 'select':
									case 'textarea':
										s.autoFocus && n.focus();
										break;
									case 'img':
										s.src && (n.src = s.src);
								}
							}
							break;
						case 6:
							break;
						case 4:
							break;
						case 12:
							break;
						case 13:
							if (t.memoizedState === null) {
								var u = t.alternate;
								if (u !== null) {
									var m = u.memoizedState;
									if (m !== null) {
										var v = m.dehydrated;
										v !== null && tr(v);
									}
								}
							}
							break;
						case 19:
						case 17:
						case 21:
						case 22:
						case 23:
						case 25:
							break;
						default:
							throw Error(S(163));
					}
				ae || (t.flags & 512 && fo(t));
			} catch (h) {
				Y(t, t.return, h);
			}
		}
		if (t === e) {
			P = null;
			break;
		}
		if (((n = t.sibling), n !== null)) {
			((n.return = t.return), (P = n));
			break;
		}
		P = t.return;
	}
}
function Ns(e) {
	for (; P !== null; ) {
		var t = P;
		if (t === e) {
			P = null;
			break;
		}
		var n = t.sibling;
		if (n !== null) {
			((n.return = t.return), (P = n));
			break;
		}
		P = t.return;
	}
}
function _s(e) {
	for (; P !== null; ) {
		var t = P;
		try {
			switch (t.tag) {
				case 0:
				case 11:
				case 15:
					var n = t.return;
					try {
						Il(4, t);
					} catch (s) {
						Y(t, n, s);
					}
					break;
				case 1:
					var r = t.stateNode;
					if (typeof r.componentDidMount == 'function') {
						var l = t.return;
						try {
							r.componentDidMount();
						} catch (s) {
							Y(t, l, s);
						}
					}
					var i = t.return;
					try {
						fo(t);
					} catch (s) {
						Y(t, i, s);
					}
					break;
				case 5:
					var o = t.return;
					try {
						fo(t);
					} catch (s) {
						Y(t, o, s);
					}
			}
		} catch (s) {
			Y(t, t.return, s);
		}
		if (t === e) {
			P = null;
			break;
		}
		var a = t.sibling;
		if (a !== null) {
			((a.return = t.return), (P = a));
			break;
		}
		P = t.return;
	}
}
var Up = Math.ceil,
	Sl = nt.ReactCurrentDispatcher,
	sa = nt.ReactCurrentOwner,
	Te = nt.ReactCurrentBatchConfig,
	F = 0,
	te = null,
	q = null,
	re = 0,
	ye = 0,
	cn = Nt(0),
	J = 0,
	dr = null,
	Vt = 0,
	$l = 0,
	ua = 0,
	Yn = null,
	pe = null,
	ca = 0,
	En = 1 / 0,
	Ke = null,
	El = !1,
	ho = null,
	gt = null,
	Ar = !1,
	ft = null,
	Cl = 0,
	Gn = 0,
	vo = null,
	Jr = -1,
	br = 0;
function ce() {
	return F & 6 ? X() : Jr !== -1 ? Jr : (Jr = X());
}
function yt(e) {
	return e.mode & 1
		? F & 2 && re !== 0
			? re & -re
			: Ep.transition !== null
				? (br === 0 && (br = Ou()), br)
				: ((e = I), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : $u(e.type))), e)
		: 1;
}
function Fe(e, t, n, r) {
	if (50 < Gn) throw ((Gn = 0), (vo = null), Error(S(185)));
	(vr(e, n, r),
		(!(F & 2) || e !== te) &&
			(e === te && (!(F & 2) && ($l |= n), J === 4 && st(e, re)),
			ge(e, r),
			n === 1 && F === 0 && !(t.mode & 1) && ((En = X() + 500), jl && _t())));
}
function ge(e, t) {
	var n = e.callbackNode;
	Ed(e, t);
	var r = al(e, e === te ? re : 0);
	if (r === 0) (n !== null && Da(n), (e.callbackNode = null), (e.callbackPriority = 0));
	else if (((t = r & -r), e.callbackPriority !== t)) {
		if ((n != null && Da(n), t === 1))
			(e.tag === 0 ? Sp(Ps.bind(null, e)) : rc(Ps.bind(null, e)),
				yp(function () {
					!(F & 6) && _t();
				}),
				(n = null));
		else {
			switch (Mu(r)) {
				case 1:
					n = Fo;
					break;
				case 4:
					n = Lu;
					break;
				case 16:
					n = ol;
					break;
				case 536870912:
					n = zu;
					break;
				default:
					n = ol;
			}
			n = nf(n, Xc.bind(null, e));
		}
		((e.callbackPriority = t), (e.callbackNode = n));
	}
}
function Xc(e, t) {
	if (((Jr = -1), (br = 0), F & 6)) throw Error(S(327));
	var n = e.callbackNode;
	if (vn() && e.callbackNode !== n) return null;
	var r = al(e, e === te ? re : 0);
	if (r === 0) return null;
	if (r & 30 || r & e.expiredLanes || t) t = Nl(e, r);
	else {
		t = r;
		var l = F;
		F |= 2;
		var i = Zc();
		(te !== e || re !== t) && ((Ke = null), (En = X() + 500), At(e, t));
		do
			try {
				Hp();
				break;
			} catch (a) {
				qc(e, a);
			}
		while (1);
		(Xo(), (Sl.current = i), (F = l), q !== null ? (t = 0) : ((te = null), (re = 0), (t = J)));
	}
	if (t !== 0) {
		if ((t === 2 && ((l = Wi(e)), l !== 0 && ((r = l), (t = go(e, l)))), t === 1))
			throw ((n = dr), At(e, 0), st(e, r), ge(e, X()), n);
		if (t === 6) st(e, r);
		else {
			if (
				((l = e.current.alternate),
				!(r & 30) &&
					!Bp(l) &&
					((t = Nl(e, r)), t === 2 && ((i = Wi(e)), i !== 0 && ((r = i), (t = go(e, i)))), t === 1))
			)
				throw ((n = dr), At(e, 0), st(e, r), ge(e, X()), n);
			switch (((e.finishedWork = l), (e.finishedLanes = r), t)) {
				case 0:
				case 1:
					throw Error(S(345));
				case 2:
					Ot(e, pe, Ke);
					break;
				case 3:
					if ((st(e, r), (r & 130023424) === r && ((t = ca + 500 - X()), 10 < t))) {
						if (al(e, 0) !== 0) break;
						if (((l = e.suspendedLanes), (l & r) !== r)) {
							(ce(), (e.pingedLanes |= e.suspendedLanes & l));
							break;
						}
						e.timeoutHandle = qi(Ot.bind(null, e, pe, Ke), t);
						break;
					}
					Ot(e, pe, Ke);
					break;
				case 4:
					if ((st(e, r), (r & 4194240) === r)) break;
					for (t = e.eventTimes, l = -1; 0 < r; ) {
						var o = 31 - De(r);
						((i = 1 << o), (o = t[o]), o > l && (l = o), (r &= ~i));
					}
					if (
						((r = l),
						(r = X() - r),
						(r =
							(120 > r
								? 120
								: 480 > r
									? 480
									: 1080 > r
										? 1080
										: 1920 > r
											? 1920
											: 3e3 > r
												? 3e3
												: 4320 > r
													? 4320
													: 1960 * Up(r / 1960)) - r),
						10 < r)
					) {
						e.timeoutHandle = qi(Ot.bind(null, e, pe, Ke), r);
						break;
					}
					Ot(e, pe, Ke);
					break;
				case 5:
					Ot(e, pe, Ke);
					break;
				default:
					throw Error(S(329));
			}
		}
	}
	return (ge(e, X()), e.callbackNode === n ? Xc.bind(null, e) : null);
}
function go(e, t) {
	var n = Yn;
	return (
		e.current.memoizedState.isDehydrated && (At(e, t).flags |= 256),
		(e = Nl(e, t)),
		e !== 2 && ((t = pe), (pe = n), t !== null && yo(t)),
		e
	);
}
function yo(e) {
	pe === null ? (pe = e) : pe.push.apply(pe, e);
}
function Bp(e) {
	for (var t = e; ; ) {
		if (t.flags & 16384) {
			var n = t.updateQueue;
			if (n !== null && ((n = n.stores), n !== null))
				for (var r = 0; r < n.length; r++) {
					var l = n[r],
						i = l.getSnapshot;
					l = l.value;
					try {
						if (!Ie(i(), l)) return !1;
					} catch {
						return !1;
					}
				}
		}
		if (((n = t.child), t.subtreeFlags & 16384 && n !== null)) ((n.return = t), (t = n));
		else {
			if (t === e) break;
			for (; t.sibling === null; ) {
				if (t.return === null || t.return === e) return !0;
				t = t.return;
			}
			((t.sibling.return = t.return), (t = t.sibling));
		}
	}
	return !0;
}
function st(e, t) {
	for (t &= ~ua, t &= ~$l, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
		var n = 31 - De(t),
			r = 1 << n;
		((e[n] = -1), (t &= ~r));
	}
}
function Ps(e) {
	if (F & 6) throw Error(S(327));
	vn();
	var t = al(e, 0);
	if (!(t & 1)) return (ge(e, X()), null);
	var n = Nl(e, t);
	if (e.tag !== 0 && n === 2) {
		var r = Wi(e);
		r !== 0 && ((t = r), (n = go(e, r)));
	}
	if (n === 1) throw ((n = dr), At(e, 0), st(e, t), ge(e, X()), n);
	if (n === 6) throw Error(S(345));
	return ((e.finishedWork = e.current.alternate), (e.finishedLanes = t), Ot(e, pe, Ke), ge(e, X()), null);
}
function fa(e, t) {
	var n = F;
	F |= 1;
	try {
		return e(t);
	} finally {
		((F = n), F === 0 && ((En = X() + 500), jl && _t()));
	}
}
function Qt(e) {
	ft !== null && ft.tag === 0 && !(F & 6) && vn();
	var t = F;
	F |= 1;
	var n = Te.transition,
		r = I;
	try {
		if (((Te.transition = null), (I = 1), e)) return e();
	} finally {
		((I = r), (Te.transition = n), (F = t), !(F & 6) && _t());
	}
}
function da() {
	((ye = cn.current), U(cn));
}
function At(e, t) {
	((e.finishedWork = null), (e.finishedLanes = 0));
	var n = e.timeoutHandle;
	if ((n !== -1 && ((e.timeoutHandle = -1), gp(n)), q !== null))
		for (n = q.return; n !== null; ) {
			var r = n;
			switch ((Ko(r), r.tag)) {
				case 1:
					((r = r.type.childContextTypes), r != null && dl());
					break;
				case 3:
					(kn(), U(he), U(se), ta());
					break;
				case 5:
					ea(r);
					break;
				case 4:
					kn();
					break;
				case 13:
					U(H);
					break;
				case 19:
					U(H);
					break;
				case 10:
					qo(r.type._context);
					break;
				case 22:
				case 23:
					da();
			}
			n = n.return;
		}
	if (
		((te = e),
		(q = e = wt(e.current, null)),
		(re = ye = t),
		(J = 0),
		(dr = null),
		(ua = $l = Vt = 0),
		(pe = Yn = null),
		Ft !== null)
	) {
		for (t = 0; t < Ft.length; t++)
			if (((n = Ft[t]), (r = n.interleaved), r !== null)) {
				n.interleaved = null;
				var l = r.next,
					i = n.pending;
				if (i !== null) {
					var o = i.next;
					((i.next = l), (r.next = o));
				}
				n.pending = r;
			}
		Ft = null;
	}
	return e;
}
function qc(e, t) {
	do {
		var n = q;
		try {
			if ((Xo(), (Xr.current = kl), xl)) {
				for (var r = V.memoizedState; r !== null; ) {
					var l = r.queue;
					(l !== null && (l.pending = null), (r = r.next));
				}
				xl = !1;
			}
			if (
				((Ht = 0),
				(ee = Z = V = null),
				(Qn = !1),
				(ur = 0),
				(sa.current = null),
				n === null || n.return === null)
			) {
				((J = 1), (dr = t), (q = null));
				break;
			}
			e: {
				var i = e,
					o = n.return,
					a = n,
					s = t;
				if (((t = re), (a.flags |= 32768), s !== null && typeof s == 'object' && typeof s.then == 'function')) {
					var u = s,
						m = a,
						v = m.tag;
					if (!(m.mode & 1) && (v === 0 || v === 11 || v === 15)) {
						var h = m.alternate;
						h
							? ((m.updateQueue = h.updateQueue),
								(m.memoizedState = h.memoizedState),
								(m.lanes = h.lanes))
							: ((m.updateQueue = null), (m.memoizedState = null));
					}
					var w = ms(o);
					if (w !== null) {
						((w.flags &= -257), hs(w, o, a, i, t), w.mode & 1 && ps(i, u, t), (t = w), (s = u));
						var C = t.updateQueue;
						if (C === null) {
							var N = new Set();
							(N.add(s), (t.updateQueue = N));
						} else C.add(s);
						break e;
					} else {
						if (!(t & 1)) {
							(ps(i, u, t), pa());
							break e;
						}
						s = Error(S(426));
					}
				} else if (B && a.mode & 1) {
					var j = ms(o);
					if (j !== null) {
						(!(j.flags & 65536) && (j.flags |= 256), hs(j, o, a, i, t), Yo(Sn(s, a)));
						break e;
					}
				}
				((i = s = Sn(s, a)), J !== 4 && (J = 2), Yn === null ? (Yn = [i]) : Yn.push(i), (i = o));
				do {
					switch (i.tag) {
						case 3:
							((i.flags |= 65536), (t &= -t), (i.lanes |= t));
							var f = Rc(i, s, t);
							os(i, f);
							break e;
						case 1:
							a = s;
							var c = i.type,
								p = i.stateNode;
							if (
								!(i.flags & 128) &&
								(typeof c.getDerivedStateFromError == 'function' ||
									(p !== null &&
										typeof p.componentDidCatch == 'function' &&
										(gt === null || !gt.has(p))))
							) {
								((i.flags |= 65536), (t &= -t), (i.lanes |= t));
								var y = jc(i, a, t);
								os(i, y);
								break e;
							}
					}
					i = i.return;
				} while (i !== null);
			}
			bc(n);
		} catch (E) {
			((t = E), q === n && n !== null && (q = n = n.return));
			continue;
		}
		break;
	} while (1);
}
function Zc() {
	var e = Sl.current;
	return ((Sl.current = kl), e === null ? kl : e);
}
function pa() {
	((J === 0 || J === 3 || J === 2) && (J = 4), te === null || (!(Vt & 268435455) && !($l & 268435455)) || st(te, re));
}
function Nl(e, t) {
	var n = F;
	F |= 2;
	var r = Zc();
	(te !== e || re !== t) && ((Ke = null), At(e, t));
	do
		try {
			Wp();
			break;
		} catch (l) {
			qc(e, l);
		}
	while (1);
	if ((Xo(), (F = n), (Sl.current = r), q !== null)) throw Error(S(261));
	return ((te = null), (re = 0), J);
}
function Wp() {
	for (; q !== null; ) Jc(q);
}
function Hp() {
	for (; q !== null && !md(); ) Jc(q);
}
function Jc(e) {
	var t = tf(e.alternate, e, ye);
	((e.memoizedProps = e.pendingProps), t === null ? bc(e) : (q = t), (sa.current = null));
}
function bc(e) {
	var t = e;
	do {
		var n = t.alternate;
		if (((e = t.return), t.flags & 32768)) {
			if (((n = Fp(n, t)), n !== null)) {
				((n.flags &= 32767), (q = n));
				return;
			}
			if (e !== null) ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
			else {
				((J = 6), (q = null));
				return;
			}
		} else if (((n = Dp(n, t, ye)), n !== null)) {
			q = n;
			return;
		}
		if (((t = t.sibling), t !== null)) {
			q = t;
			return;
		}
		q = t = e;
	} while (t !== null);
	J === 0 && (J = 5);
}
function Ot(e, t, n) {
	var r = I,
		l = Te.transition;
	try {
		((Te.transition = null), (I = 1), Vp(e, t, n, r));
	} finally {
		((Te.transition = l), (I = r));
	}
	return null;
}
function Vp(e, t, n, r) {
	do vn();
	while (ft !== null);
	if (F & 6) throw Error(S(327));
	n = e.finishedWork;
	var l = e.finishedLanes;
	if (n === null) return null;
	if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current)) throw Error(S(177));
	((e.callbackNode = null), (e.callbackPriority = 0));
	var i = n.lanes | n.childLanes;
	if (
		(Cd(e, i),
		e === te && ((q = te = null), (re = 0)),
		(!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
			Ar ||
			((Ar = !0),
			nf(ol, function () {
				return (vn(), null);
			})),
		(i = (n.flags & 15990) !== 0),
		n.subtreeFlags & 15990 || i)
	) {
		((i = Te.transition), (Te.transition = null));
		var o = I;
		I = 1;
		var a = F;
		((F |= 4),
			(sa.current = null),
			$p(e, n),
			Yc(n, e),
			cp(Gi),
			(sl = !!Yi),
			(Gi = Yi = null),
			(e.current = n),
			Ap(n),
			hd(),
			(F = a),
			(I = o),
			(Te.transition = i));
	} else e.current = n;
	if (
		(Ar && ((Ar = !1), (ft = e), (Cl = l)),
		(i = e.pendingLanes),
		i === 0 && (gt = null),
		yd(n.stateNode),
		ge(e, X()),
		t !== null)
	)
		for (r = e.onRecoverableError, n = 0; n < t.length; n++)
			((l = t[n]), r(l.value, { componentStack: l.stack, digest: l.digest }));
	if (El) throw ((El = !1), (e = ho), (ho = null), e);
	return (
		Cl & 1 && e.tag !== 0 && vn(),
		(i = e.pendingLanes),
		i & 1 ? (e === vo ? Gn++ : ((Gn = 0), (vo = e))) : (Gn = 0),
		_t(),
		null
	);
}
function vn() {
	if (ft !== null) {
		var e = Mu(Cl),
			t = Te.transition,
			n = I;
		try {
			if (((Te.transition = null), (I = 16 > e ? 16 : e), ft === null)) var r = !1;
			else {
				if (((e = ft), (ft = null), (Cl = 0), F & 6)) throw Error(S(331));
				var l = F;
				for (F |= 4, P = e.current; P !== null; ) {
					var i = P,
						o = i.child;
					if (P.flags & 16) {
						var a = i.deletions;
						if (a !== null) {
							for (var s = 0; s < a.length; s++) {
								var u = a[s];
								for (P = u; P !== null; ) {
									var m = P;
									switch (m.tag) {
										case 0:
										case 11:
										case 15:
											Kn(8, m, i);
									}
									var v = m.child;
									if (v !== null) ((v.return = m), (P = v));
									else
										for (; P !== null; ) {
											m = P;
											var h = m.sibling,
												w = m.return;
											if ((Vc(m), m === u)) {
												P = null;
												break;
											}
											if (h !== null) {
												((h.return = w), (P = h));
												break;
											}
											P = w;
										}
								}
							}
							var C = i.alternate;
							if (C !== null) {
								var N = C.child;
								if (N !== null) {
									C.child = null;
									do {
										var j = N.sibling;
										((N.sibling = null), (N = j));
									} while (N !== null);
								}
							}
							P = i;
						}
					}
					if (i.subtreeFlags & 2064 && o !== null) ((o.return = i), (P = o));
					else
						e: for (; P !== null; ) {
							if (((i = P), i.flags & 2048))
								switch (i.tag) {
									case 0:
									case 11:
									case 15:
										Kn(9, i, i.return);
								}
							var f = i.sibling;
							if (f !== null) {
								((f.return = i.return), (P = f));
								break e;
							}
							P = i.return;
						}
				}
				var c = e.current;
				for (P = c; P !== null; ) {
					o = P;
					var p = o.child;
					if (o.subtreeFlags & 2064 && p !== null) ((p.return = o), (P = p));
					else
						e: for (o = c; P !== null; ) {
							if (((a = P), a.flags & 2048))
								try {
									switch (a.tag) {
										case 0:
										case 11:
										case 15:
											Il(9, a);
									}
								} catch (E) {
									Y(a, a.return, E);
								}
							if (a === o) {
								P = null;
								break e;
							}
							var y = a.sibling;
							if (y !== null) {
								((y.return = a.return), (P = y));
								break e;
							}
							P = a.return;
						}
				}
				if (((F = l), _t(), We && typeof We.onPostCommitFiberRoot == 'function'))
					try {
						We.onPostCommitFiberRoot(Ll, e);
					} catch {}
				r = !0;
			}
			return r;
		} finally {
			((I = n), (Te.transition = t));
		}
	}
	return !1;
}
function Ts(e, t, n) {
	((t = Sn(n, t)), (t = Rc(e, t, 1)), (e = vt(e, t, 1)), (t = ce()), e !== null && (vr(e, 1, t), ge(e, t)));
}
function Y(e, t, n) {
	if (e.tag === 3) Ts(e, e, n);
	else
		for (; t !== null; ) {
			if (t.tag === 3) {
				Ts(t, e, n);
				break;
			} else if (t.tag === 1) {
				var r = t.stateNode;
				if (
					typeof t.type.getDerivedStateFromError == 'function' ||
					(typeof r.componentDidCatch == 'function' && (gt === null || !gt.has(r)))
				) {
					((e = Sn(n, e)),
						(e = jc(t, e, 1)),
						(t = vt(t, e, 1)),
						(e = ce()),
						t !== null && (vr(t, 1, e), ge(t, e)));
					break;
				}
			}
			t = t.return;
		}
}
function Qp(e, t, n) {
	var r = e.pingCache;
	(r !== null && r.delete(t),
		(t = ce()),
		(e.pingedLanes |= e.suspendedLanes & n),
		te === e &&
			(re & n) === n &&
			(J === 4 || (J === 3 && (re & 130023424) === re && 500 > X() - ca) ? At(e, 0) : (ua |= n)),
		ge(e, t));
}
function ef(e, t) {
	t === 0 && (e.mode & 1 ? ((t = Lr), (Lr <<= 1), !(Lr & 130023424) && (Lr = 4194304)) : (t = 1));
	var n = ce();
	((e = et(e, t)), e !== null && (vr(e, t, n), ge(e, n)));
}
function Kp(e) {
	var t = e.memoizedState,
		n = 0;
	(t !== null && (n = t.retryLane), ef(e, n));
}
function Yp(e, t) {
	var n = 0;
	switch (e.tag) {
		case 13:
			var r = e.stateNode,
				l = e.memoizedState;
			l !== null && (n = l.retryLane);
			break;
		case 19:
			r = e.stateNode;
			break;
		default:
			throw Error(S(314));
	}
	(r !== null && r.delete(t), ef(e, n));
}
var tf;
tf = function (e, t, n) {
	if (e !== null)
		if (e.memoizedProps !== t.pendingProps || he.current) me = !0;
		else {
			if (!(e.lanes & n) && !(t.flags & 128)) return ((me = !1), jp(e, t, n));
			me = !!(e.flags & 131072);
		}
	else ((me = !1), B && t.flags & 1048576 && lc(t, hl, t.index));
	switch (((t.lanes = 0), t.tag)) {
		case 2:
			var r = t.type;
			(Zr(e, t), (e = t.pendingProps));
			var l = yn(t, se.current);
			(hn(t, n), (l = ra(null, t, r, e, l, n)));
			var i = la();
			return (
				(t.flags |= 1),
				typeof l == 'object' && l !== null && typeof l.render == 'function' && l.$$typeof === void 0
					? ((t.tag = 1),
						(t.memoizedState = null),
						(t.updateQueue = null),
						ve(r) ? ((i = !0), pl(t)) : (i = !1),
						(t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null),
						Jo(t),
						(l.updater = Dl),
						(t.stateNode = l),
						(l._reactInternals = t),
						ro(t, r, e, n),
						(t = oo(null, t, r, !0, i, n)))
					: ((t.tag = 0), B && i && Qo(t), ue(null, t, l, n), (t = t.child)),
				t
			);
		case 16:
			r = t.elementType;
			e: {
				switch (
					(Zr(e, t),
					(e = t.pendingProps),
					(l = r._init),
					(r = l(r._payload)),
					(t.type = r),
					(l = t.tag = Xp(r)),
					(e = Me(r, e)),
					l)
				) {
					case 0:
						t = io(null, t, r, e, n);
						break e;
					case 1:
						t = ys(null, t, r, e, n);
						break e;
					case 11:
						t = vs(null, t, r, e, n);
						break e;
					case 14:
						t = gs(null, t, r, Me(r.type, e), n);
						break e;
				}
				throw Error(S(306, r, ''));
			}
			return t;
		case 0:
			return ((r = t.type), (l = t.pendingProps), (l = t.elementType === r ? l : Me(r, l)), io(e, t, r, l, n));
		case 1:
			return ((r = t.type), (l = t.pendingProps), (l = t.elementType === r ? l : Me(r, l)), ys(e, t, r, l, n));
		case 3:
			e: {
				if (($c(t), e === null)) throw Error(S(387));
				((r = t.pendingProps), (i = t.memoizedState), (l = i.element), sc(e, t), yl(t, r, null, n));
				var o = t.memoizedState;
				if (((r = o.element), i.isDehydrated))
					if (
						((i = {
							element: r,
							isDehydrated: !1,
							cache: o.cache,
							pendingSuspenseBoundaries: o.pendingSuspenseBoundaries,
							transitions: o.transitions,
						}),
						(t.updateQueue.baseState = i),
						(t.memoizedState = i),
						t.flags & 256)
					) {
						((l = Sn(Error(S(423)), t)), (t = ws(e, t, r, n, l)));
						break e;
					} else if (r !== l) {
						((l = Sn(Error(S(424)), t)), (t = ws(e, t, r, n, l)));
						break e;
					} else
						for (
							we = ht(t.stateNode.containerInfo.firstChild),
								xe = t,
								B = !0,
								je = null,
								n = dc(t, null, r, n),
								t.child = n;
							n;

						)
							((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
				else {
					if ((wn(), r === l)) {
						t = tt(e, t, n);
						break e;
					}
					ue(e, t, r, n);
				}
				t = t.child;
			}
			return t;
		case 5:
			return (
				pc(t),
				e === null && eo(t),
				(r = t.type),
				(l = t.pendingProps),
				(i = e !== null ? e.memoizedProps : null),
				(o = l.children),
				Xi(r, l) ? (o = null) : i !== null && Xi(r, i) && (t.flags |= 32),
				Ic(e, t),
				ue(e, t, o, n),
				t.child
			);
		case 6:
			return (e === null && eo(t), null);
		case 13:
			return Ac(e, t, n);
		case 4:
			return (
				bo(t, t.stateNode.containerInfo),
				(r = t.pendingProps),
				e === null ? (t.child = xn(t, null, r, n)) : ue(e, t, r, n),
				t.child
			);
		case 11:
			return ((r = t.type), (l = t.pendingProps), (l = t.elementType === r ? l : Me(r, l)), vs(e, t, r, l, n));
		case 7:
			return (ue(e, t, t.pendingProps, n), t.child);
		case 8:
			return (ue(e, t, t.pendingProps.children, n), t.child);
		case 12:
			return (ue(e, t, t.pendingProps.children, n), t.child);
		case 10:
			e: {
				if (
					((r = t.type._context),
					(l = t.pendingProps),
					(i = t.memoizedProps),
					(o = l.value),
					$(vl, r._currentValue),
					(r._currentValue = o),
					i !== null)
				)
					if (Ie(i.value, o)) {
						if (i.children === l.children && !he.current) {
							t = tt(e, t, n);
							break e;
						}
					} else
						for (i = t.child, i !== null && (i.return = t); i !== null; ) {
							var a = i.dependencies;
							if (a !== null) {
								o = i.child;
								for (var s = a.firstContext; s !== null; ) {
									if (s.context === r) {
										if (i.tag === 1) {
											((s = Ze(-1, n & -n)), (s.tag = 2));
											var u = i.updateQueue;
											if (u !== null) {
												u = u.shared;
												var m = u.pending;
												(m === null ? (s.next = s) : ((s.next = m.next), (m.next = s)),
													(u.pending = s));
											}
										}
										((i.lanes |= n),
											(s = i.alternate),
											s !== null && (s.lanes |= n),
											to(i.return, n, t),
											(a.lanes |= n));
										break;
									}
									s = s.next;
								}
							} else if (i.tag === 10) o = i.type === t.type ? null : i.child;
							else if (i.tag === 18) {
								if (((o = i.return), o === null)) throw Error(S(341));
								((o.lanes |= n),
									(a = o.alternate),
									a !== null && (a.lanes |= n),
									to(o, n, t),
									(o = i.sibling));
							} else o = i.child;
							if (o !== null) o.return = i;
							else
								for (o = i; o !== null; ) {
									if (o === t) {
										o = null;
										break;
									}
									if (((i = o.sibling), i !== null)) {
										((i.return = o.return), (o = i));
										break;
									}
									o = o.return;
								}
							i = o;
						}
				(ue(e, t, l.children, n), (t = t.child));
			}
			return t;
		case 9:
			return (
				(l = t.type),
				(r = t.pendingProps.children),
				hn(t, n),
				(l = Le(l)),
				(r = r(l)),
				(t.flags |= 1),
				ue(e, t, r, n),
				t.child
			);
		case 14:
			return ((r = t.type), (l = Me(r, t.pendingProps)), (l = Me(r.type, l)), gs(e, t, r, l, n));
		case 15:
			return Dc(e, t, t.type, t.pendingProps, n);
		case 17:
			return (
				(r = t.type),
				(l = t.pendingProps),
				(l = t.elementType === r ? l : Me(r, l)),
				Zr(e, t),
				(t.tag = 1),
				ve(r) ? ((e = !0), pl(t)) : (e = !1),
				hn(t, n),
				cc(t, r, l),
				ro(t, r, l, n),
				oo(null, t, r, !0, e, n)
			);
		case 19:
			return Uc(e, t, n);
		case 22:
			return Fc(e, t, n);
	}
	throw Error(S(156, t.tag));
};
function nf(e, t) {
	return Tu(e, t);
}
function Gp(e, t, n, r) {
	((this.tag = e),
		(this.key = n),
		(this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null),
		(this.index = 0),
		(this.ref = null),
		(this.pendingProps = t),
		(this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
		(this.mode = r),
		(this.subtreeFlags = this.flags = 0),
		(this.deletions = null),
		(this.childLanes = this.lanes = 0),
		(this.alternate = null));
}
function Pe(e, t, n, r) {
	return new Gp(e, t, n, r);
}
function ma(e) {
	return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function Xp(e) {
	if (typeof e == 'function') return ma(e) ? 1 : 0;
	if (e != null) {
		if (((e = e.$$typeof), e === Ro)) return 11;
		if (e === jo) return 14;
	}
	return 2;
}
function wt(e, t) {
	var n = e.alternate;
	return (
		n === null
			? ((n = Pe(e.tag, t, e.key, e.mode)),
				(n.elementType = e.elementType),
				(n.type = e.type),
				(n.stateNode = e.stateNode),
				(n.alternate = e),
				(e.alternate = n))
			: ((n.pendingProps = t), (n.type = e.type), (n.flags = 0), (n.subtreeFlags = 0), (n.deletions = null)),
		(n.flags = e.flags & 14680064),
		(n.childLanes = e.childLanes),
		(n.lanes = e.lanes),
		(n.child = e.child),
		(n.memoizedProps = e.memoizedProps),
		(n.memoizedState = e.memoizedState),
		(n.updateQueue = e.updateQueue),
		(t = e.dependencies),
		(n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
		(n.sibling = e.sibling),
		(n.index = e.index),
		(n.ref = e.ref),
		n
	);
}
function el(e, t, n, r, l, i) {
	var o = 2;
	if (((r = e), typeof e == 'function')) ma(e) && (o = 1);
	else if (typeof e == 'string') o = 5;
	else
		e: switch (e) {
			case bt:
				return Ut(n.children, l, i, t);
			case Mo:
				((o = 8), (l |= 8));
				break;
			case Pi:
				return ((e = Pe(12, n, t, l | 2)), (e.elementType = Pi), (e.lanes = i), e);
			case Ti:
				return ((e = Pe(13, n, t, l)), (e.elementType = Ti), (e.lanes = i), e);
			case Li:
				return ((e = Pe(19, n, t, l)), (e.elementType = Li), (e.lanes = i), e);
			case fu:
				return Al(n, l, i, t);
			default:
				if (typeof e == 'object' && e !== null)
					switch (e.$$typeof) {
						case uu:
							o = 10;
							break e;
						case cu:
							o = 9;
							break e;
						case Ro:
							o = 11;
							break e;
						case jo:
							o = 14;
							break e;
						case it:
							((o = 16), (r = null));
							break e;
					}
				throw Error(S(130, e == null ? e : typeof e, ''));
		}
	return ((t = Pe(o, n, t, l)), (t.elementType = e), (t.type = r), (t.lanes = i), t);
}
function Ut(e, t, n, r) {
	return ((e = Pe(7, e, r, t)), (e.lanes = n), e);
}
function Al(e, t, n, r) {
	return ((e = Pe(22, e, r, t)), (e.elementType = fu), (e.lanes = n), (e.stateNode = { isHidden: !1 }), e);
}
function yi(e, t, n) {
	return ((e = Pe(6, e, null, t)), (e.lanes = n), e);
}
function wi(e, t, n) {
	return (
		(t = Pe(4, e.children !== null ? e.children : [], e.key, t)),
		(t.lanes = n),
		(t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }),
		t
	);
}
function qp(e, t, n, r, l) {
	((this.tag = t),
		(this.containerInfo = e),
		(this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
		(this.timeoutHandle = -1),
		(this.callbackNode = this.pendingContext = this.context = null),
		(this.callbackPriority = 0),
		(this.eventTimes = bl(0)),
		(this.expirationTimes = bl(-1)),
		(this.entangledLanes =
			this.finishedLanes =
			this.mutableReadLanes =
			this.expiredLanes =
			this.pingedLanes =
			this.suspendedLanes =
			this.pendingLanes =
				0),
		(this.entanglements = bl(0)),
		(this.identifierPrefix = r),
		(this.onRecoverableError = l),
		(this.mutableSourceEagerHydrationData = null));
}
function ha(e, t, n, r, l, i, o, a, s) {
	return (
		(e = new qp(e, t, n, a, s)),
		t === 1 ? ((t = 1), i === !0 && (t |= 8)) : (t = 0),
		(i = Pe(3, null, null, t)),
		(e.current = i),
		(i.stateNode = e),
		(i.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: null,
			transitions: null,
			pendingSuspenseBoundaries: null,
		}),
		Jo(i),
		e
	);
}
function Zp(e, t, n) {
	var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
	return { $$typeof: Jt, key: r == null ? null : '' + r, children: e, containerInfo: t, implementation: n };
}
function rf(e) {
	if (!e) return Et;
	e = e._reactInternals;
	e: {
		if (Yt(e) !== e || e.tag !== 1) throw Error(S(170));
		var t = e;
		do {
			switch (t.tag) {
				case 3:
					t = t.stateNode.context;
					break e;
				case 1:
					if (ve(t.type)) {
						t = t.stateNode.__reactInternalMemoizedMergedChildContext;
						break e;
					}
			}
			t = t.return;
		} while (t !== null);
		throw Error(S(171));
	}
	if (e.tag === 1) {
		var n = e.type;
		if (ve(n)) return nc(e, n, t);
	}
	return t;
}
function lf(e, t, n, r, l, i, o, a, s) {
	return (
		(e = ha(n, r, !0, e, l, i, o, a, s)),
		(e.context = rf(null)),
		(n = e.current),
		(r = ce()),
		(l = yt(n)),
		(i = Ze(r, l)),
		(i.callback = t ?? null),
		vt(n, i, l),
		(e.current.lanes = l),
		vr(e, l, r),
		ge(e, r),
		e
	);
}
function Ul(e, t, n, r) {
	var l = t.current,
		i = ce(),
		o = yt(l);
	return (
		(n = rf(n)),
		t.context === null ? (t.context = n) : (t.pendingContext = n),
		(t = Ze(i, o)),
		(t.payload = { element: e }),
		(r = r === void 0 ? null : r),
		r !== null && (t.callback = r),
		(e = vt(l, t, o)),
		e !== null && (Fe(e, l, o, i), Gr(e, l, o)),
		o
	);
}
function _l(e) {
	if (((e = e.current), !e.child)) return null;
	switch (e.child.tag) {
		case 5:
			return e.child.stateNode;
		default:
			return e.child.stateNode;
	}
}
function Ls(e, t) {
	if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
		var n = e.retryLane;
		e.retryLane = n !== 0 && n < t ? n : t;
	}
}
function va(e, t) {
	(Ls(e, t), (e = e.alternate) && Ls(e, t));
}
function Jp() {
	return null;
}
var of =
	typeof reportError == 'function'
		? reportError
		: function (e) {
				console.error(e);
			};
function ga(e) {
	this._internalRoot = e;
}
Bl.prototype.render = ga.prototype.render = function (e) {
	var t = this._internalRoot;
	if (t === null) throw Error(S(409));
	Ul(e, t, null, null);
};
Bl.prototype.unmount = ga.prototype.unmount = function () {
	var e = this._internalRoot;
	if (e !== null) {
		this._internalRoot = null;
		var t = e.containerInfo;
		(Qt(function () {
			Ul(null, e, null, null);
		}),
			(t[be] = null));
	}
};
function Bl(e) {
	this._internalRoot = e;
}
Bl.prototype.unstable_scheduleHydration = function (e) {
	if (e) {
		var t = Du();
		e = { blockedOn: null, target: e, priority: t };
		for (var n = 0; n < at.length && t !== 0 && t < at[n].priority; n++);
		(at.splice(n, 0, e), n === 0 && Iu(e));
	}
};
function ya(e) {
	return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function Wl(e) {
	return !(
		!e ||
		(e.nodeType !== 1 &&
			e.nodeType !== 9 &&
			e.nodeType !== 11 &&
			(e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
	);
}
function zs() {}
function bp(e, t, n, r, l) {
	if (l) {
		if (typeof r == 'function') {
			var i = r;
			r = function () {
				var u = _l(o);
				i.call(u);
			};
		}
		var o = lf(t, r, e, 0, null, !1, !1, '', zs);
		return ((e._reactRootContainer = o), (e[be] = o.current), lr(e.nodeType === 8 ? e.parentNode : e), Qt(), o);
	}
	for (; (l = e.lastChild); ) e.removeChild(l);
	if (typeof r == 'function') {
		var a = r;
		r = function () {
			var u = _l(s);
			a.call(u);
		};
	}
	var s = ha(e, 0, !1, null, null, !1, !1, '', zs);
	return (
		(e._reactRootContainer = s),
		(e[be] = s.current),
		lr(e.nodeType === 8 ? e.parentNode : e),
		Qt(function () {
			Ul(t, s, n, r);
		}),
		s
	);
}
function Hl(e, t, n, r, l) {
	var i = n._reactRootContainer;
	if (i) {
		var o = i;
		if (typeof l == 'function') {
			var a = l;
			l = function () {
				var s = _l(o);
				a.call(s);
			};
		}
		Ul(t, o, e, l);
	} else o = bp(n, t, e, l, r);
	return _l(o);
}
Ru = function (e) {
	switch (e.tag) {
		case 3:
			var t = e.stateNode;
			if (t.current.memoizedState.isDehydrated) {
				var n = In(t.pendingLanes);
				n !== 0 && (Io(t, n | 1), ge(t, X()), !(F & 6) && ((En = X() + 500), _t()));
			}
			break;
		case 13:
			(Qt(function () {
				var r = et(e, 1);
				if (r !== null) {
					var l = ce();
					Fe(r, e, 1, l);
				}
			}),
				va(e, 1));
	}
};
$o = function (e) {
	if (e.tag === 13) {
		var t = et(e, 134217728);
		if (t !== null) {
			var n = ce();
			Fe(t, e, 134217728, n);
		}
		va(e, 134217728);
	}
};
ju = function (e) {
	if (e.tag === 13) {
		var t = yt(e),
			n = et(e, t);
		if (n !== null) {
			var r = ce();
			Fe(n, e, t, r);
		}
		va(e, t);
	}
};
Du = function () {
	return I;
};
Fu = function (e, t) {
	var n = I;
	try {
		return ((I = e), t());
	} finally {
		I = n;
	}
};
Ai = function (e, t, n) {
	switch (t) {
		case 'input':
			if ((Mi(e, n), (t = n.name), n.type === 'radio' && t != null)) {
				for (n = e; n.parentNode; ) n = n.parentNode;
				for (
					n = n.querySelectorAll('input[name=' + JSON.stringify('' + t) + '][type="radio"]'), t = 0;
					t < n.length;
					t++
				) {
					var r = n[t];
					if (r !== e && r.form === e.form) {
						var l = Rl(r);
						if (!l) throw Error(S(90));
						(pu(r), Mi(r, l));
					}
				}
			}
			break;
		case 'textarea':
			hu(e, n);
			break;
		case 'select':
			((t = n.value), t != null && fn(e, !!n.multiple, t, !1));
	}
};
Su = fa;
Eu = Qt;
var em = { usingClientEntryPoint: !1, Events: [yr, rn, Rl, xu, ku, fa] },
	jn = { findFiberByHostInstance: Dt, bundleType: 0, version: '18.2.0', rendererPackageName: 'react-dom' },
	tm = {
		bundleType: jn.bundleType,
		version: jn.version,
		rendererPackageName: jn.rendererPackageName,
		rendererConfig: jn.rendererConfig,
		overrideHookState: null,
		overrideHookStateDeletePath: null,
		overrideHookStateRenamePath: null,
		overrideProps: null,
		overridePropsDeletePath: null,
		overridePropsRenamePath: null,
		setErrorHandler: null,
		setSuspenseHandler: null,
		scheduleUpdate: null,
		currentDispatcherRef: nt.ReactCurrentDispatcher,
		findHostInstanceByFiber: function (e) {
			return ((e = _u(e)), e === null ? null : e.stateNode);
		},
		findFiberByHostInstance: jn.findFiberByHostInstance || Jp,
		findHostInstancesForRefresh: null,
		scheduleRefresh: null,
		scheduleRoot: null,
		setRefreshHandler: null,
		getCurrentFiber: null,
		reconcilerVersion: '18.2.0-next-9e3b772b8-20220608',
	};
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
	var Ur = __REACT_DEVTOOLS_GLOBAL_HOOK__;
	if (!Ur.isDisabled && Ur.supportsFiber)
		try {
			((Ll = Ur.inject(tm)), (We = Ur));
		} catch {}
}
Se.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = em;
Se.createPortal = function (e, t) {
	var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
	if (!ya(t)) throw Error(S(200));
	return Zp(e, t, null, n);
};
Se.createRoot = function (e, t) {
	if (!ya(e)) throw Error(S(299));
	var n = !1,
		r = '',
		l = of;
	return (
		t != null &&
			(t.unstable_strictMode === !0 && (n = !0),
			t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
			t.onRecoverableError !== void 0 && (l = t.onRecoverableError)),
		(t = ha(e, 1, !1, null, null, n, !1, r, l)),
		(e[be] = t.current),
		lr(e.nodeType === 8 ? e.parentNode : e),
		new ga(t)
	);
};
Se.findDOMNode = function (e) {
	if (e == null) return null;
	if (e.nodeType === 1) return e;
	var t = e._reactInternals;
	if (t === void 0)
		throw typeof e.render == 'function' ? Error(S(188)) : ((e = Object.keys(e).join(',')), Error(S(268, e)));
	return ((e = _u(t)), (e = e === null ? null : e.stateNode), e);
};
Se.flushSync = function (e) {
	return Qt(e);
};
Se.hydrate = function (e, t, n) {
	if (!Wl(t)) throw Error(S(200));
	return Hl(null, e, t, !0, n);
};
Se.hydrateRoot = function (e, t, n) {
	if (!ya(e)) throw Error(S(405));
	var r = (n != null && n.hydratedSources) || null,
		l = !1,
		i = '',
		o = of;
	if (
		(n != null &&
			(n.unstable_strictMode === !0 && (l = !0),
			n.identifierPrefix !== void 0 && (i = n.identifierPrefix),
			n.onRecoverableError !== void 0 && (o = n.onRecoverableError)),
		(t = lf(t, null, e, 1, n ?? null, l, !1, i, o)),
		(e[be] = t.current),
		lr(e),
		r)
	)
		for (e = 0; e < r.length; e++)
			((n = r[e]),
				(l = n._getVersion),
				(l = l(n._source)),
				t.mutableSourceEagerHydrationData == null
					? (t.mutableSourceEagerHydrationData = [n, l])
					: t.mutableSourceEagerHydrationData.push(n, l));
	return new Bl(t);
};
Se.render = function (e, t, n) {
	if (!Wl(t)) throw Error(S(200));
	return Hl(null, e, t, !1, n);
};
Se.unmountComponentAtNode = function (e) {
	if (!Wl(e)) throw Error(S(40));
	return e._reactRootContainer
		? (Qt(function () {
				Hl(null, null, e, !1, function () {
					((e._reactRootContainer = null), (e[be] = null));
				});
			}),
			!0)
		: !1;
};
Se.unstable_batchedUpdates = fa;
Se.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
	if (!Wl(n)) throw Error(S(200));
	if (e == null || e._reactInternals === void 0) throw Error(S(38));
	return Hl(e, t, n, !1, r);
};
Se.version = '18.2.0-next-9e3b772b8-20220608';
(function (e) {
	function t() {
		if (
			!(
				typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
				typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
			)
		)
			try {
				__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(t);
			} catch (n) {
				console.error(n);
			}
	}
	(t(), (e.exports = Se));
})(Jf);
const xi = Zs(nl);
var Os = nl;
((Ci.createRoot = Os.createRoot), (Ci.hydrateRoot = Os.hydrateRoot));
function pr() {
	return (
		(pr = Object.assign
			? Object.assign.bind()
			: function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var n = arguments[t];
						for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
					}
					return e;
				}),
		pr.apply(this, arguments)
	);
}
var $t;
(function (e) {
	((e.Pop = 'POP'), (e.Push = 'PUSH'), (e.Replace = 'REPLACE'));
})($t || ($t = {}));
var Ms = function (e) {
		return e;
	},
	Rs = 'beforeunload',
	nm = 'popstate';
function rm(e) {
	e === void 0 && (e = {});
	var t = e,
		n = t.window,
		r = n === void 0 ? document.defaultView : n,
		l = r.history;
	function i() {
		var g = r.location,
			k = g.pathname,
			O = g.search,
			z = g.hash,
			W = l.state || {};
		return [W.idx, Ms({ pathname: k, search: O, hash: z, state: W.usr || null, key: W.key || 'default' })];
	}
	var o = null;
	function a() {
		if (o) (w.call(o), (o = null));
		else {
			var g = $t.Pop,
				k = i(),
				O = k[0],
				z = k[1];
			if (w.length) {
				if (O != null) {
					var W = m - O;
					W &&
						((o = {
							action: g,
							location: z,
							retry: function () {
								E(W * -1);
							},
						}),
						E(W));
				}
			} else c(g);
		}
	}
	r.addEventListener(nm, a);
	var s = $t.Pop,
		u = i(),
		m = u[0],
		v = u[1],
		h = Ds(),
		w = Ds();
	m == null && ((m = 0), l.replaceState(pr({}, l.state, { idx: m }), ''));
	function C(g) {
		return typeof g == 'string' ? g : wo(g);
	}
	function N(g, k) {
		return (
			k === void 0 && (k = null),
			Ms(
				pr({ pathname: v.pathname, hash: '', search: '' }, typeof g == 'string' ? Gt(g) : g, {
					state: k,
					key: lm(),
				}),
			)
		);
	}
	function j(g, k) {
		return [{ usr: g.state, key: g.key, idx: k }, C(g)];
	}
	function f(g, k, O) {
		return !w.length || (w.call({ action: g, location: k, retry: O }), !1);
	}
	function c(g) {
		s = g;
		var k = i();
		((m = k[0]), (v = k[1]), h.call({ action: s, location: v }));
	}
	function p(g, k) {
		var O = $t.Push,
			z = N(g, k);
		function W() {
			p(g, k);
		}
		if (f(O, z, W)) {
			var Ce = j(z, m + 1),
				Qe = Ce[0],
				Pt = Ce[1];
			try {
				l.pushState(Qe, '', Pt);
			} catch {
				r.location.assign(Pt);
			}
			c(O);
		}
	}
	function y(g, k) {
		var O = $t.Replace,
			z = N(g, k);
		function W() {
			y(g, k);
		}
		if (f(O, z, W)) {
			var Ce = j(z, m),
				Qe = Ce[0],
				Pt = Ce[1];
			(l.replaceState(Qe, '', Pt), c(O));
		}
	}
	function E(g) {
		l.go(g);
	}
	var x = {
		get action() {
			return s;
		},
		get location() {
			return v;
		},
		createHref: C,
		push: p,
		replace: y,
		go: E,
		back: function () {
			E(-1);
		},
		forward: function () {
			E(1);
		},
		listen: function (k) {
			return h.push(k);
		},
		block: function (k) {
			var O = w.push(k);
			return (
				w.length === 1 && r.addEventListener(Rs, js),
				function () {
					(O(), w.length || r.removeEventListener(Rs, js));
				}
			);
		},
	};
	return x;
}
function js(e) {
	(e.preventDefault(), (e.returnValue = ''));
}
function Ds() {
	var e = [];
	return {
		get length() {
			return e.length;
		},
		push: function (n) {
			return (
				e.push(n),
				function () {
					e = e.filter(function (r) {
						return r !== n;
					});
				}
			);
		},
		call: function (n) {
			e.forEach(function (r) {
				return r && r(n);
			});
		},
	};
}
function lm() {
	return Math.random().toString(36).substr(2, 8);
}
function wo(e) {
	var t = e.pathname,
		n = t === void 0 ? '/' : t,
		r = e.search,
		l = r === void 0 ? '' : r,
		i = e.hash,
		o = i === void 0 ? '' : i;
	return (
		l && l !== '?' && (n += l.charAt(0) === '?' ? l : '?' + l),
		o && o !== '#' && (n += o.charAt(0) === '#' ? o : '#' + o),
		n
	);
}
function Gt(e) {
	var t = {};
	if (e) {
		var n = e.indexOf('#');
		n >= 0 && ((t.hash = e.substr(n)), (e = e.substr(0, n)));
		var r = e.indexOf('?');
		(r >= 0 && ((t.search = e.substr(r)), (e = e.substr(0, r))), e && (t.pathname = e));
	}
	return t;
}
/**
 * React Router v6.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ const wa = L.createContext(null),
	xa = L.createContext(null),
	Vl = L.createContext({ outlet: null, matches: [] });
function Ve(e, t) {
	if (!e) throw new Error(t);
}
function im(e, t, n) {
	n === void 0 && (n = '/');
	let r = typeof t == 'string' ? Gt(t) : t,
		l = uf(r.pathname || '/', n);
	if (l == null) return null;
	let i = af(e);
	om(i);
	let o = null;
	for (let a = 0; o == null && a < i.length; ++a) o = hm(i[a], l);
	return o;
}
function af(e, t, n, r) {
	return (
		t === void 0 && (t = []),
		n === void 0 && (n = []),
		r === void 0 && (r = ''),
		e.forEach((l, i) => {
			let o = { relativePath: l.path || '', caseSensitive: l.caseSensitive === !0, childrenIndex: i, route: l };
			o.relativePath.startsWith('/') &&
				(o.relativePath.startsWith(r) || Ve(!1), (o.relativePath = o.relativePath.slice(r.length)));
			let a = xt([r, o.relativePath]),
				s = n.concat(o);
			(l.children && l.children.length > 0 && (l.index === !0 && Ve(!1), af(l.children, t, s, a)),
				!(l.path == null && !l.index) && t.push({ path: a, score: pm(a, l.index), routesMeta: s }));
		}),
		t
	);
}
function om(e) {
	e.sort((t, n) =>
		t.score !== n.score
			? n.score - t.score
			: mm(
					t.routesMeta.map(r => r.childrenIndex),
					n.routesMeta.map(r => r.childrenIndex),
				),
	);
}
const am = /^:\w+$/,
	sm = 3,
	um = 2,
	cm = 1,
	fm = 10,
	dm = -2,
	Fs = e => e === '*';
function pm(e, t) {
	let n = e.split('/'),
		r = n.length;
	return (
		n.some(Fs) && (r += dm),
		t && (r += um),
		n.filter(l => !Fs(l)).reduce((l, i) => l + (am.test(i) ? sm : i === '' ? cm : fm), r)
	);
}
function mm(e, t) {
	return e.length === t.length && e.slice(0, -1).every((r, l) => r === t[l]) ? e[e.length - 1] - t[t.length - 1] : 0;
}
function hm(e, t) {
	let { routesMeta: n } = e,
		r = {},
		l = '/',
		i = [];
	for (let o = 0; o < n.length; ++o) {
		let a = n[o],
			s = o === n.length - 1,
			u = l === '/' ? t : t.slice(l.length) || '/',
			m = vm({ path: a.relativePath, caseSensitive: a.caseSensitive, end: s }, u);
		if (!m) return null;
		Object.assign(r, m.params);
		let v = a.route;
		(i.push({ params: r, pathname: xt([l, m.pathname]), pathnameBase: cf(xt([l, m.pathnameBase])), route: v }),
			m.pathnameBase !== '/' && (l = xt([l, m.pathnameBase])));
	}
	return i;
}
function vm(e, t) {
	typeof e == 'string' && (e = { path: e, caseSensitive: !1, end: !0 });
	let [n, r] = gm(e.path, e.caseSensitive, e.end),
		l = t.match(n);
	if (!l) return null;
	let i = l[0],
		o = i.replace(/(.)\/+$/, '$1'),
		a = l.slice(1);
	return {
		params: r.reduce((u, m, v) => {
			if (m === '*') {
				let h = a[v] || '';
				o = i.slice(0, i.length - h.length).replace(/(.)\/+$/, '$1');
			}
			return ((u[m] = ym(a[v] || '')), u);
		}, {}),
		pathname: i,
		pathnameBase: o,
		pattern: e,
	};
}
function gm(e, t, n) {
	(t === void 0 && (t = !1), n === void 0 && (n = !0));
	let r = [],
		l =
			'^' +
			e
				.replace(/\/*\*?$/, '')
				.replace(/^\/*/, '/')
				.replace(/[\\.*+^$?{}|()[\]]/g, '\\$&')
				.replace(/:(\w+)/g, (o, a) => (r.push(a), '([^\\/]+)'));
	return (
		e.endsWith('*')
			? (r.push('*'), (l += e === '*' || e === '/*' ? '(.*)$' : '(?:\\/(.+)|\\/*)$'))
			: (l += n ? '\\/*$' : '(?:(?=[.~-]|%[0-9A-F]{2})|\\b|\\/|$)'),
		[new RegExp(l, t ? void 0 : 'i'), r]
	);
}
function ym(e, t) {
	try {
		return decodeURIComponent(e);
	} catch {
		return e;
	}
}
function wm(e, t) {
	t === void 0 && (t = '/');
	let { pathname: n, search: r = '', hash: l = '' } = typeof e == 'string' ? Gt(e) : e;
	return { pathname: n ? (n.startsWith('/') ? n : xm(n, t)) : t, search: Sm(r), hash: Em(l) };
}
function xm(e, t) {
	let n = t.replace(/\/+$/, '').split('/');
	return (
		e.split('/').forEach(l => {
			l === '..' ? n.length > 1 && n.pop() : l !== '.' && n.push(l);
		}),
		n.length > 1 ? n.join('/') : '/'
	);
}
function sf(e, t, n) {
	let r = typeof e == 'string' ? Gt(e) : e,
		l = e === '' || r.pathname === '' ? '/' : r.pathname,
		i;
	if (l == null) i = n;
	else {
		let a = t.length - 1;
		if (l.startsWith('..')) {
			let s = l.split('/');
			for (; s[0] === '..'; ) (s.shift(), (a -= 1));
			r.pathname = s.join('/');
		}
		i = a >= 0 ? t[a] : '/';
	}
	let o = wm(r, i);
	return (l && l !== '/' && l.endsWith('/') && !o.pathname.endsWith('/') && (o.pathname += '/'), o);
}
function km(e) {
	return e === '' || e.pathname === '' ? '/' : typeof e == 'string' ? Gt(e).pathname : e.pathname;
}
function uf(e, t) {
	if (t === '/') return e;
	if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
	let n = e.charAt(t.length);
	return n && n !== '/' ? null : e.slice(t.length) || '/';
}
const xt = e => e.join('/').replace(/\/\/+/g, '/'),
	cf = e => e.replace(/\/+$/, '').replace(/^\/*/, '/'),
	Sm = e => (!e || e === '?' ? '' : e.startsWith('?') ? e : '?' + e),
	Em = e => (!e || e === '#' ? '' : e.startsWith('#') ? e : '#' + e);
function Cm(e) {
	xr() || Ve(!1);
	let { basename: t, navigator: n } = L.useContext(wa),
		{ hash: r, pathname: l, search: i } = ff(e),
		o = l;
	if (t !== '/') {
		let a = km(e),
			s = a != null && a.endsWith('/');
		o = l === '/' ? t + (s ? '/' : '') : xt([t, l]);
	}
	return n.createHref({ pathname: o, search: i, hash: r });
}
function xr() {
	return L.useContext(xa) != null;
}
function kr() {
	return (xr() || Ve(!1), L.useContext(xa).location);
}
function Nm() {
	xr() || Ve(!1);
	let { basename: e, navigator: t } = L.useContext(wa),
		{ matches: n } = L.useContext(Vl),
		{ pathname: r } = kr(),
		l = JSON.stringify(n.map(a => a.pathnameBase)),
		i = L.useRef(!1);
	return (
		L.useEffect(() => {
			i.current = !0;
		}),
		L.useCallback(
			function (a, s) {
				if ((s === void 0 && (s = {}), !i.current)) return;
				if (typeof a == 'number') {
					t.go(a);
					return;
				}
				let u = sf(a, JSON.parse(l), r);
				(e !== '/' && (u.pathname = xt([e, u.pathname])), (s.replace ? t.replace : t.push)(u, s.state));
			},
			[e, t, l, r],
		)
	);
}
function ff(e) {
	let { matches: t } = L.useContext(Vl),
		{ pathname: n } = kr(),
		r = JSON.stringify(t.map(l => l.pathnameBase));
	return L.useMemo(() => sf(e, JSON.parse(r), n), [e, r, n]);
}
function _m(e, t) {
	xr() || Ve(!1);
	let { matches: n } = L.useContext(Vl),
		r = n[n.length - 1],
		l = r ? r.params : {};
	r && r.pathname;
	let i = r ? r.pathnameBase : '/';
	r && r.route;
	let o = kr(),
		a;
	if (t) {
		var s;
		let h = typeof t == 'string' ? Gt(t) : t;
		(i === '/' || ((s = h.pathname) != null && s.startsWith(i)) || Ve(!1), (a = h));
	} else a = o;
	let u = a.pathname || '/',
		m = i === '/' ? u : u.slice(i.length) || '/',
		v = im(e, { pathname: m });
	return Pm(
		v &&
			v.map(h =>
				Object.assign({}, h, {
					params: Object.assign({}, l, h.params),
					pathname: xt([i, h.pathname]),
					pathnameBase: h.pathnameBase === '/' ? i : xt([i, h.pathnameBase]),
				}),
			),
		n,
	);
}
function Pm(e, t) {
	return (
		t === void 0 && (t = []),
		e == null
			? null
			: e.reduceRight(
					(n, r, l) =>
						L.createElement(Vl.Provider, {
							children: r.route.element !== void 0 ? r.route.element : n,
							value: { outlet: n, matches: t.concat(e.slice(0, l + 1)) },
						}),
					null,
				)
	);
}
function df(e) {
	Ve(!1);
}
function Tm(e) {
	let {
		basename: t = '/',
		children: n = null,
		location: r,
		navigationType: l = $t.Pop,
		navigator: i,
		static: o = !1,
	} = e;
	xr() && Ve(!1);
	let a = cf(t),
		s = L.useMemo(() => ({ basename: a, navigator: i, static: o }), [a, i, o]);
	typeof r == 'string' && (r = Gt(r));
	let { pathname: u = '/', search: m = '', hash: v = '', state: h = null, key: w = 'default' } = r,
		C = L.useMemo(() => {
			let N = uf(u, a);
			return N == null ? null : { pathname: N, search: m, hash: v, state: h, key: w };
		}, [a, u, m, v, h, w]);
	return C == null
		? null
		: L.createElement(
				wa.Provider,
				{ value: s },
				L.createElement(xa.Provider, { children: n, value: { location: C, navigationType: l } }),
			);
}
function Lm(e) {
	let { children: t, location: n } = e;
	return _m(xo(t), n);
}
function xo(e) {
	let t = [];
	return (
		L.Children.forEach(e, n => {
			if (!L.isValidElement(n)) return;
			if (n.type === L.Fragment) {
				t.push.apply(t, xo(n.props.children));
				return;
			}
			n.type !== df && Ve(!1);
			let r = {
				caseSensitive: n.props.caseSensitive,
				element: n.props.element,
				index: n.props.index,
				path: n.props.path,
			};
			(n.props.children && (r.children = xo(n.props.children)), t.push(r));
		}),
		t
	);
}
/**
 * React Router DOM v6.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function ko() {
	return (
		(ko =
			Object.assign ||
			function (e) {
				for (var t = 1; t < arguments.length; t++) {
					var n = arguments[t];
					for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
				}
				return e;
			}),
		ko.apply(this, arguments)
	);
}
function zm(e, t) {
	if (e == null) return {};
	var n = {},
		r = Object.keys(e),
		l,
		i;
	for (i = 0; i < r.length; i++) ((l = r[i]), !(t.indexOf(l) >= 0) && (n[l] = e[l]));
	return n;
}
const Om = ['onClick', 'reloadDocument', 'replace', 'state', 'target', 'to'];
function Mm(e) {
	let { basename: t, children: n, window: r } = e,
		l = L.useRef();
	l.current == null && (l.current = rm({ window: r }));
	let i = l.current,
		[o, a] = L.useState({ action: i.action, location: i.location });
	return (
		L.useLayoutEffect(() => i.listen(a), [i]),
		L.createElement(Tm, { basename: t, children: n, location: o.location, navigationType: o.action, navigator: i })
	);
}
function Rm(e) {
	return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
const jm = L.forwardRef(function (t, n) {
	let { onClick: r, reloadDocument: l, replace: i = !1, state: o, target: a, to: s } = t,
		u = zm(t, Om),
		m = Cm(s),
		v = Dm(s, { replace: i, state: o, target: a });
	function h(w) {
		(r && r(w), !w.defaultPrevented && !l && v(w));
	}
	return L.createElement('a', ko({}, u, { href: m, onClick: h, ref: n, target: a }));
});
function Dm(e, t) {
	let { target: n, replace: r, state: l } = t === void 0 ? {} : t,
		i = Nm(),
		o = kr(),
		a = ff(e);
	return L.useCallback(
		s => {
			if (s.button === 0 && (!n || n === '_self') && !Rm(s)) {
				s.preventDefault();
				let u = !!r || wo(o) === wo(a);
				i(e, { replace: u, state: l });
			}
		},
		[o, i, a, r, l, n, e],
	);
}
var pf = 'Expected a function',
	Is = 0 / 0,
	Fm = '[object Symbol]',
	Im = /^\s+|\s+$/g,
	$m = /^[-+]0x[0-9a-f]+$/i,
	Am = /^0b[01]+$/i,
	Um = /^0o[0-7]+$/i,
	Bm = parseInt,
	Wm = typeof ut == 'object' && ut && ut.Object === Object && ut,
	Hm = typeof self == 'object' && self && self.Object === Object && self,
	Vm = Wm || Hm || Function('return this')(),
	Qm = Object.prototype,
	Km = Qm.toString,
	Ym = Math.max,
	Gm = Math.min,
	ki = function () {
		return Vm.Date.now();
	};
function Xm(e, t, n) {
	var r,
		l,
		i,
		o,
		a,
		s,
		u = 0,
		m = !1,
		v = !1,
		h = !0;
	if (typeof e != 'function') throw new TypeError(pf);
	((t = $s(t) || 0),
		Pl(n) &&
			((m = !!n.leading),
			(v = 'maxWait' in n),
			(i = v ? Ym($s(n.maxWait) || 0, t) : i),
			(h = 'trailing' in n ? !!n.trailing : h)));
	function w(x) {
		var g = r,
			k = l;
		return ((r = l = void 0), (u = x), (o = e.apply(k, g)), o);
	}
	function C(x) {
		return ((u = x), (a = setTimeout(f, t)), m ? w(x) : o);
	}
	function N(x) {
		var g = x - s,
			k = x - u,
			O = t - g;
		return v ? Gm(O, i - k) : O;
	}
	function j(x) {
		var g = x - s,
			k = x - u;
		return s === void 0 || g >= t || g < 0 || (v && k >= i);
	}
	function f() {
		var x = ki();
		if (j(x)) return c(x);
		a = setTimeout(f, N(x));
	}
	function c(x) {
		return ((a = void 0), h && r ? w(x) : ((r = l = void 0), o));
	}
	function p() {
		(a !== void 0 && clearTimeout(a), (u = 0), (r = s = l = a = void 0));
	}
	function y() {
		return a === void 0 ? o : c(ki());
	}
	function E() {
		var x = ki(),
			g = j(x);
		if (((r = arguments), (l = this), (s = x), g)) {
			if (a === void 0) return C(s);
			if (v) return ((a = setTimeout(f, t)), w(s));
		}
		return (a === void 0 && (a = setTimeout(f, t)), o);
	}
	return ((E.cancel = p), (E.flush = y), E);
}
function qm(e, t, n) {
	var r = !0,
		l = !0;
	if (typeof e != 'function') throw new TypeError(pf);
	return (
		Pl(n) && ((r = 'leading' in n ? !!n.leading : r), (l = 'trailing' in n ? !!n.trailing : l)),
		Xm(e, t, { leading: r, maxWait: t, trailing: l })
	);
}
function Pl(e) {
	var t = typeof e;
	return !!e && (t == 'object' || t == 'function');
}
function Zm(e) {
	return !!e && typeof e == 'object';
}
function Jm(e) {
	return typeof e == 'symbol' || (Zm(e) && Km.call(e) == Fm);
}
function $s(e) {
	if (typeof e == 'number') return e;
	if (Jm(e)) return Is;
	if (Pl(e)) {
		var t = typeof e.valueOf == 'function' ? e.valueOf() : e;
		e = Pl(t) ? t + '' : t;
	}
	if (typeof e != 'string') return e === 0 ? e : +e;
	e = e.replace(Im, '');
	var n = Am.test(e);
	return n || Um.test(e) ? Bm(e.slice(2), n ? 2 : 8) : $m.test(e) ? Is : +e;
}
var bm = qm,
	eh = 'Expected a function',
	As = 0 / 0,
	th = '[object Symbol]',
	nh = /^\s+|\s+$/g,
	rh = /^[-+]0x[0-9a-f]+$/i,
	lh = /^0b[01]+$/i,
	ih = /^0o[0-7]+$/i,
	oh = parseInt,
	ah = typeof ut == 'object' && ut && ut.Object === Object && ut,
	sh = typeof self == 'object' && self && self.Object === Object && self,
	uh = ah || sh || Function('return this')(),
	ch = Object.prototype,
	fh = ch.toString,
	dh = Math.max,
	ph = Math.min,
	Si = function () {
		return uh.Date.now();
	};
function mh(e, t, n) {
	var r,
		l,
		i,
		o,
		a,
		s,
		u = 0,
		m = !1,
		v = !1,
		h = !0;
	if (typeof e != 'function') throw new TypeError(eh);
	((t = Us(t) || 0),
		So(n) &&
			((m = !!n.leading),
			(v = 'maxWait' in n),
			(i = v ? dh(Us(n.maxWait) || 0, t) : i),
			(h = 'trailing' in n ? !!n.trailing : h)));
	function w(x) {
		var g = r,
			k = l;
		return ((r = l = void 0), (u = x), (o = e.apply(k, g)), o);
	}
	function C(x) {
		return ((u = x), (a = setTimeout(f, t)), m ? w(x) : o);
	}
	function N(x) {
		var g = x - s,
			k = x - u,
			O = t - g;
		return v ? ph(O, i - k) : O;
	}
	function j(x) {
		var g = x - s,
			k = x - u;
		return s === void 0 || g >= t || g < 0 || (v && k >= i);
	}
	function f() {
		var x = Si();
		if (j(x)) return c(x);
		a = setTimeout(f, N(x));
	}
	function c(x) {
		return ((a = void 0), h && r ? w(x) : ((r = l = void 0), o));
	}
	function p() {
		(a !== void 0 && clearTimeout(a), (u = 0), (r = s = l = a = void 0));
	}
	function y() {
		return a === void 0 ? o : c(Si());
	}
	function E() {
		var x = Si(),
			g = j(x);
		if (((r = arguments), (l = this), (s = x), g)) {
			if (a === void 0) return C(s);
			if (v) return ((a = setTimeout(f, t)), w(s));
		}
		return (a === void 0 && (a = setTimeout(f, t)), o);
	}
	return ((E.cancel = p), (E.flush = y), E);
}
function So(e) {
	var t = typeof e;
	return !!e && (t == 'object' || t == 'function');
}
function hh(e) {
	return !!e && typeof e == 'object';
}
function vh(e) {
	return typeof e == 'symbol' || (hh(e) && fh.call(e) == th);
}
function Us(e) {
	if (typeof e == 'number') return e;
	if (vh(e)) return As;
	if (So(e)) {
		var t = typeof e.valueOf == 'function' ? e.valueOf() : e;
		e = So(t) ? t + '' : t;
	}
	if (typeof e != 'string') return e === 0 ? e : +e;
	e = e.replace(nh, '');
	var n = lh.test(e);
	return n || ih.test(e) ? oh(e.slice(2), n ? 2 : 8) : rh.test(e) ? As : +e;
}
var Bs = mh,
	mf = function () {};
function hf(e) {
	var t = void 0,
		n = void 0,
		r = void 0;
	for (t = 0; t < e.length; t += 1)
		if (((n = e[t]), (n.dataset && n.dataset.aos) || ((r = n.children && hf(n.children)), r))) return !0;
	return !1;
}
function gh(e) {
	e &&
		e.forEach(function (t) {
			var n = Array.prototype.slice.call(t.addedNodes),
				r = Array.prototype.slice.call(t.removedNodes),
				l = n.concat(r);
			if (hf(l)) return mf();
		});
}
function vf() {
	return window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
}
function yh() {
	return !!vf();
}
function wh(e, t) {
	var n = window.document,
		r = vf(),
		l = new r(gh);
	((mf = t), l.observe(n.documentElement, { childList: !0, subtree: !0, removedNodes: !0 }));
}
var Ws = { isSupported: yh, ready: wh },
	xh = function (e, t) {
		if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
	},
	kh = (function () {
		function e(t, n) {
			for (var r = 0; r < n.length; r++) {
				var l = n[r];
				((l.enumerable = l.enumerable || !1),
					(l.configurable = !0),
					'value' in l && (l.writable = !0),
					Object.defineProperty(t, l.key, l));
			}
		}
		return function (t, n, r) {
			return (n && e(t.prototype, n), r && e(t, r), t);
		};
	})(),
	Sh =
		Object.assign ||
		function (e) {
			for (var t = 1; t < arguments.length; t++) {
				var n = arguments[t];
				for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
			}
			return e;
		},
	Eh =
		/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i,
	Ch =
		/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i,
	Nh =
		/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i,
	_h =
		/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;
function Hs() {
	return navigator.userAgent || navigator.vendor || window.opera || '';
}
var Ph = (function () {
		function e() {
			xh(this, e);
		}
		return (
			kh(e, [
				{
					key: 'phone',
					value: function () {
						var n = Hs();
						return !!(Eh.test(n) || Ch.test(n.substr(0, 4)));
					},
				},
				{
					key: 'mobile',
					value: function () {
						var n = Hs();
						return !!(Nh.test(n) || _h.test(n.substr(0, 4)));
					},
				},
				{
					key: 'tablet',
					value: function () {
						return this.mobile() && !this.phone();
					},
				},
				{
					key: 'ie11',
					value: function () {
						return (
							'-ms-scroll-limit' in document.documentElement.style &&
							'-ms-ime-align' in document.documentElement.style
						);
					},
				},
			]),
			e
		);
	})(),
	tl = new Ph(),
	Th = function (t, n) {
		return (
			n &&
			n.forEach(function (r) {
				return t.classList.add(r);
			})
		);
	},
	Lh = function (t, n) {
		return (
			n &&
			n.forEach(function (r) {
				return t.classList.remove(r);
			})
		);
	},
	Br = function (t, n) {
		var r = void 0;
		return (
			tl.ie11()
				? ((r = document.createEvent('CustomEvent')), r.initCustomEvent(t, !0, !0, { detail: n }))
				: (r = new CustomEvent(t, { detail: n })),
			document.dispatchEvent(r)
		);
	},
	zh = function (t, n) {
		var r = t.options,
			l = t.position,
			i = t.node;
		t.data;
		var o = function () {
				t.animated &&
					(Lh(i, r.animatedClassNames),
					Br('aos:out', i),
					t.options.id && Br('aos:in:' + t.options.id, i),
					(t.animated = !1));
			},
			a = function () {
				t.animated ||
					(Th(i, r.animatedClassNames),
					Br('aos:in', i),
					t.options.id && Br('aos:in:' + t.options.id, i),
					(t.animated = !0));
			};
		r.mirror && n >= l.out && !r.once ? o() : n >= l.in ? a() : t.animated && !r.once && o();
	},
	Vs = function (t) {
		return t.forEach(function (n, r) {
			return zh(n, window.pageYOffset);
		});
	},
	gf = function (t) {
		for (var n = 0, r = 0; t && !isNaN(t.offsetLeft) && !isNaN(t.offsetTop); )
			((n += t.offsetLeft - (t.tagName != 'BODY' ? t.scrollLeft : 0)),
				(r += t.offsetTop - (t.tagName != 'BODY' ? t.scrollTop : 0)),
				(t = t.offsetParent));
		return { top: r, left: n };
	},
	kt = function (e, t, n) {
		var r = e.getAttribute('data-aos-' + t);
		if (typeof r < 'u') {
			if (r === 'true') return !0;
			if (r === 'false') return !1;
		}
		return r || n;
	},
	Oh = function (t, n, r) {
		var l = window.innerHeight,
			i = kt(t, 'anchor'),
			o = kt(t, 'anchor-placement'),
			a = Number(kt(t, 'offset', o ? 0 : n)),
			s = o || r,
			u = t;
		i && document.querySelectorAll(i) && (u = document.querySelectorAll(i)[0]);
		var m = gf(u).top - l;
		switch (s) {
			case 'top-bottom':
				break;
			case 'center-bottom':
				m += u.offsetHeight / 2;
				break;
			case 'bottom-bottom':
				m += u.offsetHeight;
				break;
			case 'top-center':
				m += l / 2;
				break;
			case 'center-center':
				m += l / 2 + u.offsetHeight / 2;
				break;
			case 'bottom-center':
				m += l / 2 + u.offsetHeight;
				break;
			case 'top-top':
				m += l;
				break;
			case 'bottom-top':
				m += l + u.offsetHeight;
				break;
			case 'center-top':
				m += l + u.offsetHeight / 2;
				break;
		}
		return m + a;
	},
	Mh = function (t, n) {
		var r = kt(t, 'anchor'),
			l = kt(t, 'offset', n),
			i = t;
		r && document.querySelectorAll(r) && (i = document.querySelectorAll(r)[0]);
		var o = gf(i).top;
		return o + i.offsetHeight - l;
	},
	Rh = function (t, n) {
		return (
			t.forEach(function (r, l) {
				var i = kt(r.node, 'mirror', n.mirror),
					o = kt(r.node, 'once', n.once),
					a = kt(r.node, 'id'),
					s = n.useClassNames && r.node.getAttribute('data-aos'),
					u = [n.animatedClassName].concat(s ? s.split(' ') : []).filter(function (m) {
						return typeof m == 'string';
					});
				(n.initClassName && r.node.classList.add(n.initClassName),
					(r.position = { in: Oh(r.node, n.offset, n.anchorPlacement), out: i && Mh(r.node, n.offset) }),
					(r.options = { once: o, mirror: i, animatedClassNames: u, id: a }));
			}),
			t
		);
	},
	yf = function () {
		var e = document.querySelectorAll('[data-aos]');
		return Array.prototype.map.call(e, function (t) {
			return { node: t };
		});
	},
	Ge = [],
	Qs = !1,
	K = {
		offset: 120,
		delay: 0,
		easing: 'ease',
		duration: 400,
		disable: !1,
		once: !1,
		mirror: !1,
		anchorPlacement: 'top-bottom',
		startEvent: 'DOMContentLoaded',
		animatedClassName: 'aos-animate',
		initClassName: 'aos-init',
		useClassNames: !1,
		disableMutationObserver: !1,
		throttleDelay: 99,
		debounceDelay: 50,
	},
	wf = function () {
		return document.all && !window.atob;
	},
	jh = function () {
		return (
			(Ge = Rh(Ge, K)),
			Vs(Ge),
			window.addEventListener(
				'scroll',
				bm(function () {
					Vs(Ge, K.once);
				}, K.throttleDelay),
			),
			Ge
		);
	},
	jt = function () {
		var t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !1;
		(t && (Qs = !0), Qs && jh());
	},
	xf = function () {
		if (((Ge = yf()), Sf(K.disable) || wf())) return kf();
		jt();
	},
	kf = function () {
		Ge.forEach(function (t, n) {
			(t.node.removeAttribute('data-aos'),
				t.node.removeAttribute('data-aos-easing'),
				t.node.removeAttribute('data-aos-duration'),
				t.node.removeAttribute('data-aos-delay'),
				K.initClassName && t.node.classList.remove(K.initClassName),
				K.animatedClassName && t.node.classList.remove(K.animatedClassName));
		});
	},
	Sf = function (t) {
		return (
			t === !0 ||
			(t === 'mobile' && tl.mobile()) ||
			(t === 'phone' && tl.phone()) ||
			(t === 'tablet' && tl.tablet()) ||
			(typeof t == 'function' && t() === !0)
		);
	},
	Dh = function (t) {
		return (
			(K = Sh(K, t)),
			(Ge = yf()),
			!K.disableMutationObserver &&
				!Ws.isSupported() &&
				(console.info(`
      aos: MutationObserver is not supported on this browser,
      code mutations observing has been disabled.
      You may have to call "refreshHard()" by yourself.
    `),
				(K.disableMutationObserver = !0)),
			K.disableMutationObserver || Ws.ready('[data-aos]', xf),
			Sf(K.disable) || wf()
				? kf()
				: (document.querySelector('body').setAttribute('data-aos-easing', K.easing),
					document.querySelector('body').setAttribute('data-aos-duration', K.duration),
					document.querySelector('body').setAttribute('data-aos-delay', K.delay),
					['DOMContentLoaded', 'load'].indexOf(K.startEvent) === -1
						? document.addEventListener(K.startEvent, function () {
								jt(!0);
							})
						: window.addEventListener('load', function () {
								jt(!0);
							}),
					K.startEvent === 'DOMContentLoaded' &&
						['complete', 'interactive'].indexOf(document.readyState) > -1 &&
						jt(!0),
					window.addEventListener('resize', Bs(jt, K.debounceDelay, !0)),
					window.addEventListener('orientationchange', Bs(jt, K.debounceDelay, !0)),
					Ge)
		);
	},
	Fh = { init: Dh, refresh: jt, refreshHard: xf };
const Ih = '/assets/pinataLogo-removebg-preview-ae07913d.png';
function $h() {
	const [e, t] = L.useState(!0);
	return (
		L.useEffect(() => {
			const n = () => {
				window.pageYOffset > 10 ? t(!1) : t(!0);
			};
			return (window.addEventListener('scroll', n), () => window.removeEventListener('scroll', n));
		}, [e]),
		d('header', {
			className: `fixed w-full z-30 md:bg-opacity-90 transition duration-300 ease-in-out ${!e && 'bg-white backdrop-blur-sm shadow-lg'}`,
			children: d('div', {
				className: 'max-w-6xl mx-auto px-5 sm:px-6',
				children: _('div', {
					className: 'flex items-center justify-between h-16 md:h-20',
					children: [
						d('div', {
							className: 'flex-shrink-0 mr-4',
							children: d(jm, {
								to: '/',
								className: 'block',
								'aria-label': 'Pinata',
								children: d('img', {
									className: 'md:max-w-none mx-auto rounded',
									src: Ih,
									width: '80',
									height: '562',
									alt: 'Features bg',
								}),
							}),
						}),
						d('h1', {
							className: 'text-2xl',
							style: { fontFamily: 'Fredoka One', color: '#497174' },
							children: 'P I N A T A',
						}),
					],
				}),
			}),
		})
	);
}
const Ah = '/assets/IllustHero-9fd7cff5.png';
function Uh() {
	return _('section', {
		className: 'relative',
		children: [
			d('div', {
				className: 'absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none',
				'aria-hidden': 'true',
				children: _('svg', {
					width: '1360',
					height: '578',
					viewBox: '0 0 1360 578',
					xmlns: 'http://www.w3.org/2000/svg',
					children: [
						d('defs', {
							children: _('linearGradient', {
								x1: '50%',
								y1: '0%',
								x2: '50%',
								y2: '100%',
								id: 'illustration-01',
								children: [
									d('stop', { stopColor: '#FFF', offset: '0%' }),
									d('stop', { stopColor: '#EAEAEA', offset: '77.402%' }),
									d('stop', { stopColor: '#DFDFDF', offset: '100%' }),
								],
							}),
						}),
						_('g', {
							fill: 'url(#illustration-01)',
							fillRule: 'evenodd',
							children: [
								d('circle', { cx: '1232', cy: '128', r: '128' }),
								d('circle', { cx: '155', cy: '443', r: '64' }),
							],
						}),
					],
				}),
			}),
			d('div', {
				className: 'max-w-6xl mx-auto px-4 sm:px-6',
				children: _('div', {
					className: 'pt-32 pb-12 md:pt-40 md:pb-20',
					children: [
						_('div', {
							className: 'text-center pb-12 md:pb-16',
							children: [
								_('h1', {
									className:
										'text-5xl md:text-6xl font-extrabold leading-tighter tracking-tighter mb-4',
									'data-aos': 'zoom-y-out',
									children: [
										'Maximize Your ',
										d('span', {
											style: {
												background: 'linear-gradient(to right, #7E120A 0%, #EB6440 100%)',
												'-webkit-background-clip': 'text',
												'-webkit-text-fill-color': 'transparent',
											},
											children: 'Business Potential',
										}),
									],
								}),
								d('div', {
									className: 'max-w-3xl mx-auto',
									children: d('p', {
										className: 'text-xl text-gray-600 mb-8',
										'data-aos': 'zoom-y-out',
										'data-aos-delay': '150',
										children:
											"Get expert advice to grow your business. Let's achieve success together.",
									}),
								}),
							],
						}),
						d('div', {
							children: d('div', {
								className: 'relative flex justify-center mb-8',
								'data-aos': 'zoom-y-out',
								'data-aos-delay': '450',
								children: _('div', {
									className: 'flex flex-col justify-center',
									children: [
										d('img', {
											className: 'mx-auto',
											src: Ah,
											width: '768',
											height: '432',
											alt: 'Hero',
										}),
										d('svg', {
											className: 'absolute inset-0 max-w-full mx-auto md:max-w-none h-auto',
											width: '768',
											height: '432',
											viewBox: '0 0 768 432',
											xmlns: 'http://www.w3.org/2000/svg',
											xmlnsXlink: 'http://www.w3.org/1999/xlink',
											children: _('defs', {
												children: [
													_('linearGradient', {
														x1: '50%',
														y1: '0%',
														x2: '50%',
														y2: '100%',
														id: 'hero-ill-a',
														children: [
															d('stop', { stopColor: '#FFF', offset: '0%' }),
															d('stop', { stopColor: '#EAEAEA', offset: '77.402%' }),
															d('stop', { stopColor: '#DFDFDF', offset: '100%' }),
														],
													}),
													_('linearGradient', {
														x1: '50%',
														y1: '0%',
														x2: '50%',
														y2: '99.24%',
														id: 'hero-ill-b',
														children: [
															d('stop', { stopColor: '#FFF', offset: '0%' }),
															d('stop', { stopColor: '#EAEAEA', offset: '48.57%' }),
															d('stop', {
																stopColor: '#DFDFDF',
																stopOpacity: '0',
																offset: '100%',
															}),
														],
													}),
													_('radialGradient', {
														cx: '21.152%',
														cy: '86.063%',
														fx: '21.152%',
														fy: '86.063%',
														r: '79.941%',
														id: 'hero-ill-e',
														children: [
															d('stop', { stopColor: '#4FD1C5', offset: '0%' }),
															d('stop', { stopColor: '#81E6D9', offset: '25.871%' }),
															d('stop', { stopColor: '#338CF5', offset: '100%' }),
														],
													}),
													d('circle', { id: 'hero-ill-d', cx: '384', cy: '216', r: '64' }),
												],
											}),
										}),
									],
								}),
							}),
						}),
					],
				}),
			}),
		],
	});
}
function Ef(e, t) {
	if (e == null) return {};
	var n = {},
		r = Object.keys(e),
		l,
		i;
	for (i = 0; i < r.length; i++) ((l = r[i]), !(t.indexOf(l) >= 0) && (n[l] = e[l]));
	return n;
}
function Eo(e, t) {
	return (
		(Eo = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (r, l) {
					return ((r.__proto__ = l), r);
				}),
		Eo(e, t)
	);
}
function Cf(e, t) {
	((e.prototype = Object.create(t.prototype)), (e.prototype.constructor = e), Eo(e, t));
}
function Bh(e, t) {
	return e.classList
		? !!t && e.classList.contains(t)
		: (' ' + (e.className.baseVal || e.className) + ' ').indexOf(' ' + t + ' ') !== -1;
}
function Wh(e, t) {
	e.classList
		? e.classList.add(t)
		: Bh(e, t) ||
			(typeof e.className == 'string'
				? (e.className = e.className + ' ' + t)
				: e.setAttribute('class', ((e.className && e.className.baseVal) || '') + ' ' + t));
}
function Ks(e, t) {
	return e
		.replace(new RegExp('(^|\\s)' + t + '(?:\\s|$)', 'g'), '$1')
		.replace(/\s+/g, ' ')
		.replace(/^\s*|\s*$/g, '');
}
function Hh(e, t) {
	e.classList
		? e.classList.remove(t)
		: typeof e.className == 'string'
			? (e.className = Ks(e.className, t))
			: e.setAttribute('class', Ks((e.className && e.className.baseVal) || '', t));
}
const Ys = { disabled: !1 },
	Nf = Be.createContext(null);
var An = 'unmounted',
	Mt = 'exited',
	Rt = 'entering',
	Zt = 'entered',
	Co = 'exiting',
	rt = (function (e) {
		Cf(t, e);
		function t(r, l) {
			var i;
			i = e.call(this, r, l) || this;
			var o = l,
				a = o && !o.isMounting ? r.enter : r.appear,
				s;
			return (
				(i.appearStatus = null),
				r.in
					? a
						? ((s = Mt), (i.appearStatus = Rt))
						: (s = Zt)
					: r.unmountOnExit || r.mountOnEnter
						? (s = An)
						: (s = Mt),
				(i.state = { status: s }),
				(i.nextCallback = null),
				i
			);
		}
		t.getDerivedStateFromProps = function (l, i) {
			var o = l.in;
			return o && i.status === An ? { status: Mt } : null;
		};
		var n = t.prototype;
		return (
			(n.componentDidMount = function () {
				this.updateStatus(!0, this.appearStatus);
			}),
			(n.componentDidUpdate = function (l) {
				var i = null;
				if (l !== this.props) {
					var o = this.state.status;
					this.props.in ? o !== Rt && o !== Zt && (i = Rt) : (o === Rt || o === Zt) && (i = Co);
				}
				this.updateStatus(!1, i);
			}),
			(n.componentWillUnmount = function () {
				this.cancelNextCallback();
			}),
			(n.getTimeouts = function () {
				var l = this.props.timeout,
					i,
					o,
					a;
				return (
					(i = o = a = l),
					l != null &&
						typeof l != 'number' &&
						((i = l.exit), (o = l.enter), (a = l.appear !== void 0 ? l.appear : o)),
					{ exit: i, enter: o, appear: a }
				);
			}),
			(n.updateStatus = function (l, i) {
				(l === void 0 && (l = !1),
					i !== null
						? (this.cancelNextCallback(), i === Rt ? this.performEnter(l) : this.performExit())
						: this.props.unmountOnExit && this.state.status === Mt && this.setState({ status: An }));
			}),
			(n.performEnter = function (l) {
				var i = this,
					o = this.props.enter,
					a = this.context ? this.context.isMounting : l,
					s = this.props.nodeRef ? [a] : [xi.findDOMNode(this), a],
					u = s[0],
					m = s[1],
					v = this.getTimeouts(),
					h = a ? v.appear : v.enter;
				if ((!l && !o) || Ys.disabled) {
					this.safeSetState({ status: Zt }, function () {
						i.props.onEntered(u);
					});
					return;
				}
				(this.props.onEnter(u, m),
					this.safeSetState({ status: Rt }, function () {
						(i.props.onEntering(u, m),
							i.onTransitionEnd(h, function () {
								i.safeSetState({ status: Zt }, function () {
									i.props.onEntered(u, m);
								});
							}));
					}));
			}),
			(n.performExit = function () {
				var l = this,
					i = this.props.exit,
					o = this.getTimeouts(),
					a = this.props.nodeRef ? void 0 : xi.findDOMNode(this);
				if (!i || Ys.disabled) {
					this.safeSetState({ status: Mt }, function () {
						l.props.onExited(a);
					});
					return;
				}
				(this.props.onExit(a),
					this.safeSetState({ status: Co }, function () {
						(l.props.onExiting(a),
							l.onTransitionEnd(o.exit, function () {
								l.safeSetState({ status: Mt }, function () {
									l.props.onExited(a);
								});
							}));
					}));
			}),
			(n.cancelNextCallback = function () {
				this.nextCallback !== null && (this.nextCallback.cancel(), (this.nextCallback = null));
			}),
			(n.safeSetState = function (l, i) {
				((i = this.setNextCallback(i)), this.setState(l, i));
			}),
			(n.setNextCallback = function (l) {
				var i = this,
					o = !0;
				return (
					(this.nextCallback = function (a) {
						o && ((o = !1), (i.nextCallback = null), l(a));
					}),
					(this.nextCallback.cancel = function () {
						o = !1;
					}),
					this.nextCallback
				);
			}),
			(n.onTransitionEnd = function (l, i) {
				this.setNextCallback(i);
				var o = this.props.nodeRef ? this.props.nodeRef.current : xi.findDOMNode(this),
					a = l == null && !this.props.addEndListener;
				if (!o || a) {
					setTimeout(this.nextCallback, 0);
					return;
				}
				if (this.props.addEndListener) {
					var s = this.props.nodeRef ? [this.nextCallback] : [o, this.nextCallback],
						u = s[0],
						m = s[1];
					this.props.addEndListener(u, m);
				}
				l != null && setTimeout(this.nextCallback, l);
			}),
			(n.render = function () {
				var l = this.state.status;
				if (l === An) return null;
				var i = this.props,
					o = i.children;
				(i.in,
					i.mountOnEnter,
					i.unmountOnExit,
					i.appear,
					i.enter,
					i.exit,
					i.timeout,
					i.addEndListener,
					i.onEnter,
					i.onEntering,
					i.onEntered,
					i.onExit,
					i.onExiting,
					i.onExited,
					i.nodeRef);
				var a = Ef(i, [
					'children',
					'in',
					'mountOnEnter',
					'unmountOnExit',
					'appear',
					'enter',
					'exit',
					'timeout',
					'addEndListener',
					'onEnter',
					'onEntering',
					'onEntered',
					'onExit',
					'onExiting',
					'onExited',
					'nodeRef',
				]);
				return Be.createElement(
					Nf.Provider,
					{ value: null },
					typeof o == 'function' ? o(l, a) : Be.cloneElement(Be.Children.only(o), a),
				);
			}),
			t
		);
	})(Be.Component);
rt.contextType = Nf;
rt.propTypes = {};
function qt() {}
rt.defaultProps = {
	in: !1,
	mountOnEnter: !1,
	unmountOnExit: !1,
	appear: !1,
	enter: !0,
	exit: !0,
	onEnter: qt,
	onEntering: qt,
	onEntered: qt,
	onExit: qt,
	onExiting: qt,
	onExited: qt,
};
rt.UNMOUNTED = An;
rt.EXITED = Mt;
rt.ENTERING = Rt;
rt.ENTERED = Zt;
rt.EXITING = Co;
const Vh = rt;
var Qh = function (t, n) {
		return (
			t &&
			n &&
			n.split(' ').forEach(function (r) {
				return Wh(t, r);
			})
		);
	},
	Ei = function (t, n) {
		return (
			t &&
			n &&
			n.split(' ').forEach(function (r) {
				return Hh(t, r);
			})
		);
	},
	ka = (function (e) {
		Cf(t, e);
		function t() {
			for (var r, l = arguments.length, i = new Array(l), o = 0; o < l; o++) i[o] = arguments[o];
			return (
				(r = e.call.apply(e, [this].concat(i)) || this),
				(r.appliedClasses = { appear: {}, enter: {}, exit: {} }),
				(r.onEnter = function (a, s) {
					var u = r.resolveArguments(a, s),
						m = u[0],
						v = u[1];
					(r.removeClasses(m, 'exit'),
						r.addClass(m, v ? 'appear' : 'enter', 'base'),
						r.props.onEnter && r.props.onEnter(a, s));
				}),
				(r.onEntering = function (a, s) {
					var u = r.resolveArguments(a, s),
						m = u[0],
						v = u[1],
						h = v ? 'appear' : 'enter';
					(r.addClass(m, h, 'active'), r.props.onEntering && r.props.onEntering(a, s));
				}),
				(r.onEntered = function (a, s) {
					var u = r.resolveArguments(a, s),
						m = u[0],
						v = u[1],
						h = v ? 'appear' : 'enter';
					(r.removeClasses(m, h), r.addClass(m, h, 'done'), r.props.onEntered && r.props.onEntered(a, s));
				}),
				(r.onExit = function (a) {
					var s = r.resolveArguments(a),
						u = s[0];
					(r.removeClasses(u, 'appear'),
						r.removeClasses(u, 'enter'),
						r.addClass(u, 'exit', 'base'),
						r.props.onExit && r.props.onExit(a));
				}),
				(r.onExiting = function (a) {
					var s = r.resolveArguments(a),
						u = s[0];
					(r.addClass(u, 'exit', 'active'), r.props.onExiting && r.props.onExiting(a));
				}),
				(r.onExited = function (a) {
					var s = r.resolveArguments(a),
						u = s[0];
					(r.removeClasses(u, 'exit'),
						r.addClass(u, 'exit', 'done'),
						r.props.onExited && r.props.onExited(a));
				}),
				(r.resolveArguments = function (a, s) {
					return r.props.nodeRef ? [r.props.nodeRef.current, a] : [a, s];
				}),
				(r.getClassNames = function (a) {
					var s = r.props.classNames,
						u = typeof s == 'string',
						m = u && s ? s + '-' : '',
						v = u ? '' + m + a : s[a],
						h = u ? v + '-active' : s[a + 'Active'],
						w = u ? v + '-done' : s[a + 'Done'];
					return { baseClassName: v, activeClassName: h, doneClassName: w };
				}),
				r
			);
		}
		var n = t.prototype;
		return (
			(n.addClass = function (l, i, o) {
				var a = this.getClassNames(i)[o + 'ClassName'],
					s = this.getClassNames('enter'),
					u = s.doneClassName;
				(i === 'appear' && o === 'done' && u && (a += ' ' + u),
					o === 'active' && l && l.scrollTop,
					a && ((this.appliedClasses[i][o] = a), Qh(l, a)));
			}),
			(n.removeClasses = function (l, i) {
				var o = this.appliedClasses[i],
					a = o.base,
					s = o.active,
					u = o.done;
				((this.appliedClasses[i] = {}), a && Ei(l, a), s && Ei(l, s), u && Ei(l, u));
			}),
			(n.render = function () {
				var l = this.props;
				l.classNames;
				var i = Ef(l, ['classNames']);
				return Be.createElement(
					Vh,
					pr({}, i, {
						onEnter: this.onEnter,
						onEntered: this.onEntered,
						onEntering: this.onEntering,
						onExit: this.onExit,
						onExiting: this.onExiting,
						onExited: this.onExited,
					}),
				);
			}),
			t
		);
	})(Be.Component);
ka.defaultProps = { classNames: '' };
ka.propTypes = {};
const Kh = ka,
	Gs = Be.createContext({ parent: {} });
function Yh() {
	const e = L.useRef(!0);
	return (
		L.useEffect(() => {
			e.current = !1;
		}, []),
		e.current
	);
}
function Xs({
	show: e,
	enter: t = '',
	enterStart: n = '',
	enterEnd: r = '',
	leave: l = '',
	leaveStart: i = '',
	leaveEnd: o = '',
	appear: a,
	unmountOnExit: s,
	tag: u = 'div',
	children: m,
	...v
}) {
	const h = t.split(' ').filter(g => g.length),
		w = n.split(' ').filter(g => g.length),
		C = r.split(' ').filter(g => g.length),
		N = l.split(' ').filter(g => g.length),
		j = i.split(' ').filter(g => g.length),
		f = o.split(' ').filter(g => g.length),
		c = s;
	function p(g, k) {
		k.length && g.classList.add(...k);
	}
	function y(g, k) {
		k.length && g.classList.remove(...k);
	}
	const E = Be.useRef(null);
	return d(Kh, {
		appear: a,
		nodeRef: E,
		unmountOnExit: c,
		in: e,
		addEndListener: g => {
			E.current.addEventListener('transitionend', g, !1);
		},
		onEnter: () => {
			(c || (E.current.style.display = null), p(E.current, [...h, ...w]));
		},
		onEntering: () => {
			(y(E.current, w), p(E.current, C));
		},
		onEntered: () => {
			y(E.current, [...C, ...h]);
		},
		onExit: () => {
			p(E.current, [...N, ...j]);
		},
		onExiting: () => {
			(y(E.current, j), p(E.current, f));
		},
		onExited: () => {
			(y(E.current, [...f, ...N]), c || (E.current.style.display = 'none'));
		},
		children: d(u, { ref: E, ...v, style: { display: c ? null : 'none' }, children: m }),
	});
}
function Wr({ show: e, appear: t, ...n }) {
	const { parent: r } = L.useContext(Gs),
		l = Yh();
	return e === void 0
		? d(Xs, { appear: r.appear || !r.isInitialRender, show: r.show, ...n })
		: d(Gs.Provider, {
				value: { parent: { show: e, isInitialRender: l, appear: t } },
				children: d(Xs, { appear: t, show: e, ...n }),
			});
}
const Gh = '/assets/0275-277696a7.png',
	Xh = '/assets/AVATARZ - Tomas-9921b855.png',
	qh = '/assets/Working from Home-f90955e6.png',
	Zh = '/assets/35-1ce40476.png';
function Jh() {
	const [e, t] = L.useState(1),
		n = L.useRef(null),
		r = () => {
			n.current.children[e] && (n.current.style.height = n.current.children[e - 1].offsetHeight + 'px');
		};
	return (
		L.useEffect(() => {
			r();
		}, [e]),
		_('section', {
			className: 'relative',
			children: [
				d('div', {
					className: 'absolute inset-0 bg-gray-100 pointer-events-none mb-16',
					'aria-hidden': 'true',
				}),
				d('div', {
					className: 'absolute left-0 right-0 m-auto w-px p-px h-20 bg-gray-200 transform -translate-y-1/2',
				}),
				d('div', {
					className: 'relative max-w-6xl mx-auto px-4 sm:px-6',
					children: _('div', {
						className: 'pt-12 md:pt-20',
						children: [
							_('div', {
								className: 'max-w-3xl mx-auto text-center pb-12 md:pb-16',
								children: [
									d('h1', { className: 'h2 mb-4', children: 'What can we bring for you?' }),
									d('p', {
										className: 'text-xl text-gray-600',
										children:
											"At  Pinata, we understand the unique challenges that an enterprise faces in today's competitive business landscape. Whether you are just starting your business or looking to expand, our experienced team of consultants is here to provide you with tailored solutions that drive growth, improve efficiency, and maximize profitability.",
									}),
								],
							}),
							_('div', {
								className: 'md:grid md:grid-cols-12 md:gap-6',
								children: [
									_('div', {
										className:
											'max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6 md:mt-6',
										'data-aos': 'fade-right',
										children: [
											_('div', {
												className: 'md:pr-4 lg:pr-12 xl:pr-16 mb-8',
												children: [
													d('h3', { className: 'h3 mb-3', children: 'Why Choose Us?' }),
													d('p', {
														className: 'text-md text-gray-600',
														children:
															'Partnering with us offers the advantage of our deep local expertise in the Indian market. We understand the cultural, economic, and regulatory intricacies, ensuring our strategies align with your business needs. Pinata stays current on industry trends and government policies, providing precise and timely advice for a competitive edge.',
													}),
												],
											}),
											_('div', {
												className: 'mb-8 md:mb-0',
												children: [
													_('a', {
														className: `flex items-center text-base p-5 rounded border transition duration-300 ease-in-out mb-3 ${e !== 1 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`,
														href: '#0',
														onClick: l => {
															(l.preventDefault(), t(1));
														},
														children: [
															_('div', {
																children: [
																	d('div', {
																		className:
																			'font-bold leading-snug tracking-tight mb-1',
																		children: 'Experience:',
																	}),
																	d('div', {
																		className: 'text-gray-600 text-sm',
																		children:
																			'We possess extensive experience across various industries, allowing us to offer tailor-made solutions that cater to your specific business needs.',
																	}),
																],
															}),
															d('div', {
																className:
																	'flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3',
																children: d('svg', {
																	className: 'w-3 h-3 fill-current',
																	viewBox: '0 0 12 12',
																	xmlns: 'http://www.w3.org/2000/svg',
																	children: d('path', {
																		d: 'M11.953 4.29a.5.5 0 00-.454-.292H6.14L6.984.62A.5.5 0 006.12.173l-6 7a.5.5 0 00.379.825h5.359l-.844 3.38a.5.5 0 00.864.445l6-7a.5.5 0 00.075-.534z',
																	}),
																}),
															}),
														],
													}),
													_('a', {
														className: `flex items-center text-base p-5 rounded border transition duration-300 ease-in-out mb-3 ${e !== 2 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`,
														href: '#0',
														onClick: l => {
															(l.preventDefault(), t(2));
														},
														children: [
															_('div', {
																children: [
																	d('div', {
																		className:
																			'font-bold leading-snug tracking-tight mb-1',
																		children: 'Holistic Approach:',
																	}),
																	d('div', {
																		className: 'text-gray-600 text-sm',
																		children:
																			'We prioritize understanding your unique circumstances and goals to develop comprehensive strategies.',
																	}),
																],
															}),
															d('div', {
																className:
																	'flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3',
																children: d('svg', {
																	className: 'w-3 h-3 fill-current',
																	viewBox: '0 0 12 12',
																	xmlns: 'http://www.w3.org/2000/svg',
																	children: d('path', {
																		d: 'M11.854.146a.5.5 0 00-.525-.116l-11 4a.5.5 0 00-.015.934l4.8 1.921 1.921 4.8A.5.5 0 007.5 12h.008a.5.5 0 00.462-.329l4-11a.5.5 0 00-.116-.525z',
																		fillRule: 'nonzero',
																	}),
																}),
															}),
														],
													}),
													_('a', {
														className: `flex items-center text-base p-5 rounded border transition duration-300 ease-in-out mb-3 ${e !== 3 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`,
														href: '#0',
														onClick: l => {
															(l.preventDefault(), t(3));
														},
														children: [
															_('div', {
																children: [
																	d('div', {
																		className:
																			'font-bold leading-snug tracking-tight mb-1',
																		children: 'Results-Driven: ',
																	}),
																	d('div', {
																		className: 'text-gray-600 text-sm',
																		children:
																			'We are committed to achieving tangible and measurable results. Our consultants will work with you every step of the way to ensure the successful implementation of our recommendations.',
																	}),
																],
															}),
															d('div', {
																className:
																	'flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3',
																children: d('svg', {
																	className: 'w-3 h-3 fill-current',
																	viewBox: '0 0 12 12',
																	xmlns: 'http://www.w3.org/2000/svg',
																	children: d('path', {
																		d: 'M11.334 8.06a.5.5 0 00-.421-.237 6.023 6.023 0 01-5.905-6c0-.41.042-.82.125-1.221a.5.5 0 00-.614-.586 6 6 0 106.832 8.529.5.5 0 00-.017-.485z',
																		fill: '#191919',
																		fillRule: 'nonzero',
																	}),
																}),
															}),
														],
													}),
													_('a', {
														className: `flex items-center text-base p-5 rounded border transition duration-300 ease-in-out mb-3 ${e !== 4 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`,
														href: '#0',
														onClick: l => {
															(l.preventDefault(), t(4));
														},
														children: [
															_('div', {
																children: [
																	d('div', {
																		className:
																			'font-bold leading-snug tracking-tight mb-1',
																		children: 'Long-term Partnership: ',
																	}),
																	d('div', {
																		className: 'text-gray-600 text-sm',
																		children:
																			'We view our relationship with clients as a long-term partnership. We will be there to support you not only during the initial consulting process but also as your business continues to grow and evolve.',
																	}),
																],
															}),
															d('div', {
																className:
																	'flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3',
																children: d('svg', {
																	className: 'w-3 h-3 fill-current',
																	viewBox: '0 0 12 12',
																	xmlns: 'http://www.w3.org/2000/svg',
																	children: d('path', {
																		d: 'M11.334 8.06a.5.5 0 00-.421-.237 6.023 6.023 0 01-5.905-6c0-.41.042-.82.125-1.221a.5.5 0 00-.614-.586 6 6 0 106.832 8.529.5.5 0 00-.017-.485z',
																		fill: '#191919',
																		fillRule: 'nonzero',
																	}),
																}),
															}),
														],
													}),
												],
											}),
										],
									}),
									d('div', {
										className:
											'max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:order-1',
										'data-aos': 'zoom-y-out',
										ref: n,
										children: _('div', {
											className: 'relative flex flex-col text-center lg:text-right',
											children: [
												d(Wr, {
													show: e === 1,
													appear: !0,
													className: 'w-full',
													enter: 'transition ease-in-out duration-700 transform order-first',
													enterStart: 'opacity-0 translate-y-16',
													enterEnd: 'opacity-100 translate-y-0',
													leave: 'transition ease-in-out duration-300 transform absolute',
													leaveStart: 'opacity-100 translate-y-0',
													leaveEnd: 'opacity-0 -translate-y-16',
													children: d('div', {
														className: 'relative inline-flex flex-col',
														children: d('img', {
															className: 'relative md:max-w-none mx-auto rounded',
															src: Xh,
															width: '800',
															height: '562',
															alt: 'Features bg',
														}),
													}),
												}),
												d(Wr, {
													show: e === 2,
													appear: !0,
													className: 'w-full',
													enter: 'transition ease-in-out duration-700 transform order-first',
													enterStart: 'opacity-0 translate-y-16',
													enterEnd: 'opacity-100 translate-y-0',
													leave: 'transition ease-in-out duration-300 transform absolute',
													leaveStart: 'opacity-100 translate-y-0',
													leaveEnd: 'opacity-0 -translate-y-16',
													children: d('div', {
														className: 'relative inline-flex flex-col',
														children: d('img', {
															className: 'relative md:max-w-none mx-auto rounded',
															src: Gh,
															width: '800',
															height: '562',
															alt: 'Features bg',
														}),
													}),
												}),
												d(Wr, {
													show: e === 3,
													appear: !0,
													className: 'w-full',
													enter: 'transition ease-in-out duration-700 transform order-first',
													enterStart: 'opacity-0 translate-y-16',
													enterEnd: 'opacity-100 translate-y-0',
													leave: 'transition ease-in-out duration-300 transform absolute',
													leaveStart: 'opacity-100 translate-y-0',
													leaveEnd: 'opacity-0 -translate-y-16',
													children: d('div', {
														className: 'relative inline-flex flex-col',
														children: d('img', {
															className: 'relative md:max-w-none mx-auto rounded',
															src: Zh,
															width: '800',
															height: '562',
															alt: 'Features bg',
														}),
													}),
												}),
												d(Wr, {
													show: e === 4,
													appear: !0,
													className: 'w-full',
													enter: 'transition ease-in-out duration-700 transform order-first',
													enterStart: 'opacity-0 translate-y-16',
													enterEnd: 'opacity-100 translate-y-0',
													leave: 'transition ease-in-out duration-300 transform absolute',
													leaveStart: 'opacity-100 translate-y-0',
													leaveEnd: 'opacity-0 -translate-y-16',
													children: d('div', {
														className: 'relative inline-flex flex-col',
														children: d('img', {
															className: 'relative md:max-w-none mx-auto rounded',
															src: qh,
															width: '800',
															height: '562',
															alt: 'Features bg',
														}),
													}),
												}),
											],
										}),
									}),
								],
							}),
						],
					}),
				}),
			],
		})
	);
}
function bh() {
	return _('section', {
		className: 'relative',
		children: [
			d('div', {
				className: 'absolute inset-0 top-1/2 md:mt-24 lg:mt-0 bg-gray-900 pointer-events-none',
				'aria-hidden': 'true',
			}),
			d('div', {
				className:
					'absolute left-0 right-0 bottom-0 m-auto w-px p-px h-20 bg-gray-200 transform translate-y-1/2',
			}),
			d('div', {
				className: 'relative max-w-6xl mx-auto px-4 sm:px-6',
				children: _('div', {
					className: 'py-12 md:py-20',
					children: [
						_('div', {
							className: 'max-w-3xl mx-auto text-center pb-12 md:pb-20',
							children: [
								d('h2', { className: 'h2 mb-4', children: 'Our services' }),
								d('p', {
									className: 'text-xl text-gray-600',
									children:
										'We are passionate about empowering MSMEs to thrive. We believe that every small manufacturer deserves the opportunity to succeed, and through our consulting services, we aim to level the playing field and insightful resources that can propel your business forward. At Pinata, our array of services is designed to elevate every aspect of your MSME journey. Choose excellence, choose Pinata! 🌟',
								}),
							],
						}),
						_('div', {
							className:
								'max-w-sm mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start md:max-w-2xl lg:max-w-none',
							children: [
								_('div', {
									className: 'relative flex flex-col p-6 bg-white rounded shadow-xl',
									children: [
										d('center', {
											children: d('svg', {
												className: 'w-16 h-16 p-1 -mt-1 mb-2',
												viewBox: '0 0 64 64',
												xmlns: 'http://www.w3.org/2000/svg',
												children: _('g', {
													fill: 'none',
													fillRule: 'evenodd',
													children: [
														d('rect', {
															className: 'fill-current',
															width: '64',
															height: '64',
															rx: '32',
															style: { color: '#d93a10' },
														}),
														_('g', {
															strokeWidth: '2',
															children: [
																d('path', {
																	className: 'stroke-current ',
																	d: 'M34.514 35.429l2.057 2.285h8M20.571 26.286h5.715l2.057 2.285',
																	style: { color: '#000' },
																}),
																d('path', {
																	className: 'stroke-current text-white',
																	d: 'M20.571 37.714h5.715L36.57 26.286h8',
																}),
																d('path', {
																	className: 'stroke-current ',
																	strokeLinecap: 'square',
																	d: 'M41.143 34.286l3.428 3.428-3.428 3.429',
																	style: { color: '#000' },
																}),
																d('path', {
																	className: 'stroke-current text-white',
																	strokeLinecap: 'square',
																	d: 'M41.143 29.714l3.428-3.428-3.428-3.429',
																}),
															],
														}),
													],
												}),
											}),
										}),
										d('h4', {
											className: 'text-lg font-bold leading-snug tracking-tight mb-1',
											children: 'Business Planning & Strategy 🚀',
										}),
										d('p', {
											className: 'text-gray-600 text-md',
											children:
												"At Pinata, we believe that a robust plan is the cornerstone of a thriving business. Collaborating closely with you, our experts develop comprehensive business plans and strategies tailored to achieve your short and long-term goals. From in-depth market analysis and competitive research to meticulous financial forecasting and risk management, we've got every aspect covered.",
										}),
									],
								}),
								_('div', {
									className: 'relative flex flex-col p-6 bg-white rounded shadow-xl',
									children: [
										d('center', {
											children: d('svg', {
												className: 'w-16 h-16 p-1 -mt-1 mb-2',
												viewBox: '0 0 64 64',
												xmlns: 'http://www.w3.org/2000/svg',
												children: _('g', {
													fill: 'none',
													fillRule: 'evenodd',
													children: [
														d('rect', {
															className: 'fill-current',
															width: '64',
															height: '64',
															rx: '32',
															style: { color: '#d93a10' },
														}),
														_('g', {
															strokeWidth: '2',
															transform: 'translate(19.429 20.571)',
															children: [
																d('circle', {
																	className: 'stroke-current text-white',
																	strokeLinecap: 'square',
																	cx: '12.571',
																	cy: '12.571',
																	r: '1.143',
																}),
																d('path', {
																	className: 'stroke-current text-white',
																	d: 'M19.153 23.267c3.59-2.213 5.99-6.169 5.99-10.696C25.143 5.63 19.514 0 12.57 0 5.63 0 0 5.629 0 12.571c0 4.527 2.4 8.483 5.99 10.696',
																}),
																d('path', {
																	className: 'stroke-current',
																	d: 'M16.161 18.406a6.848 6.848 0 003.268-5.835 6.857 6.857 0 00-6.858-6.857 6.857 6.857 0 00-6.857 6.857 6.848 6.848 0 003.268 5.835',
																	style: { color: '#000' },
																}),
															],
														}),
													],
												}),
											}),
										}),
										d('h4', {
											className: 'text-lg font-bold leading-snug tracking-tight mb-1',
											children: 'Financial Management 💰',
										}),
										d('p', {
											className: 'text-gray-600 text-md',
											children:
												'For MSMEs, effective allocation of financial resources is paramount. Our financial consultants are dedicated to assisting you with budgeting, cash flow management, cost optimization, and financial modeling. We aim to empower you with the knowledge and tools needed to make informed decisions, ensuring your finances are not just managed but optimized for maximum profitability.',
										}),
									],
								}),
								_('div', {
									className: 'relative flex flex-col p-6 bg-white rounded shadow-xl',
									children: [
										d('center', {
											children: d('svg', {
												className: 'w-16 h-16 p-1 -mt-1 mb-2',
												viewBox: '0 0 64 64',
												xmlns: 'http://www.w3.org/2000/svg',
												children: _('g', {
													fill: 'none',
													fillRule: 'evenodd',
													children: [
														d('rect', {
															className: 'fill-current',
															width: '64',
															height: '64',
															rx: '32',
															style: { color: '#d93a10' },
														}),
														_('g', {
															strokeLinecap: 'square',
															strokeWidth: '2',
															children: [
																d('path', {
																	className: 'stroke-current ',
																	d: 'M38.826 22.504a9.128 9.128 0 00-13.291-.398M35.403 25.546a4.543 4.543 0 00-6.635-.207',
																	style: { color: '#000' },
																}),
																d('path', {
																	className: 'stroke-current text-white',
																	d: 'M19.429 25.143A6.857 6.857 0 0126.286 32v1.189L28 37.143l-1.714.571V40A2.286 2.286 0 0124 42.286h-2.286v2.285M44.571 25.143A6.857 6.857 0 0037.714 32v1.189L36 37.143l1.714.571V40A2.286 2.286 0 0040 42.286h2.286v2.285',
																}),
															],
														}),
													],
												}),
											}),
										}),
										d('h4', {
											className: 'text-lg font-bold leading-snug tracking-tight mb-1',
											children: 'Ops & Process Improvement 🔄',
										}),
										d('p', {
											className: 'text-gray-600 text-md',
											children:
												'Efficiency is the key to sustained growth. Our consultants specialize in identifying bottlenecks and streamlining processes to enhance productivity and reduce costs. By analyzing your operations and implementing best practices, we empower your business to deliver exceptional products or services. We transform challenges into opportunities, ensuring your operations are finely tuned for success.',
										}),
									],
								}),
								_('div', {
									className: 'relative flex flex-col p-6 bg-white rounded shadow-xl',
									children: [
										d('center', {
											children: d('svg', {
												className: 'w-16 h-16 p-1 -mt-1 mb-2',
												viewBox: '0 0 64 64',
												xmlns: 'http://www.w3.org/2000/svg',
												children: _('g', {
													fill: 'none',
													fillRule: 'evenodd',
													children: [
														d('rect', {
															className: 'fill-current',
															width: '64',
															height: '64',
															rx: '32',
															style: { color: '#d93a10' },
														}),
														_('g', {
															transform: 'translate(22.857 19.429)',
															strokeWidth: '2',
															children: [
																d('path', {
																	className: 'stroke-current text-white',
																	strokeLinecap: 'square',
																	d: 'M12.571 4.571V0H0v25.143h12.571V20.57',
																}),
																d('path', {
																	className: 'stroke-current text-white',
																	d: 'M16 12.571h8',
																}),
																d('path', {
																	className: 'stroke-current text-white',
																	strokeLinecap: 'square',
																	d: 'M19.429 8L24 12.571l-4.571 4.572',
																}),
																d('circle', {
																	className: 'stroke-current',
																	strokeLinecap: 'square',
																	cx: '12.571',
																	cy: '12.571',
																	r: '3.429',
																	style: { color: '#000' },
																}),
															],
														}),
													],
												}),
											}),
										}),
										d('h4', {
											className: 'text-lg font-bold leading-snug tracking-tight mb-1',
											children: 'Marketing and Branding 📢',
										}),
										d('p', {
											className: 'text-gray-600 text-md',
											children:
												"In the competitive landscape of MSMEs, effective marketing is non-negotiable. Our marketing experts collaborate closely with you to develop personalized strategies, build your brand's identity, and deploy various channels to generate leads and boost visibility. From conceptualization to execution, we ensure your brand stands out.",
										}),
									],
								}),
								_('div', {
									className: 'relative flex flex-col p-6 bg-white rounded shadow-xl',
									children: [
										d('center', {
											children: d('svg', {
												className: 'w-16 h-16 p-1 -mt-1 mb-2',
												viewBox: '0 0 64 64',
												xmlns: 'http://www.w3.org/2000/svg',
												children: _('g', {
													fill: 'none',
													fillRule: 'evenodd',
													children: [
														d('rect', {
															className: 'fill-current',
															width: '64',
															height: '64',
															rx: '32',
															style: { color: '#d93a10' },
														}),
														_('g', {
															strokeLinecap: 'square',
															strokeWidth: '2',
															children: [
																d('path', {
																	className: 'stroke-current text-white',
																	d: 'M20.571 20.571h13.714v17.143H20.571z',
																}),
																d('path', {
																	className: 'stroke-current',
																	d: 'M38.858 26.993l6.397 1.73-4.473 16.549-13.24-3.58',
																	style: { color: '#000' },
																}),
															],
														}),
													],
												}),
											}),
										}),
										d('h4', {
											className: 'text-lg font-bold leading-snug tracking-tight mb-1',
											children: 'Tech & Digital Transformation 🔧',
										}),
										d('p', {
											className: 'text-gray-600 text-md',
											children:
												'In the digital age, staying ahead is imperative. Our consultants guide you through the process of digital transformation, leveraging technology to streamline operations, drive innovation, enhance customer experience, and gain a competitive edge. We ensure your business not only adapts to the digital era but thrives in it.',
										}),
									],
								}),
								_('div', {
									className: 'relative flex flex-col p-6 bg-white rounded shadow-xl',
									children: [
										d('center', {
											children: d('svg', {
												className: 'w-16 h-16 p-1 -mt-1 mb-2',
												viewBox: '0 0 64 64',
												xmlns: 'http://www.w3.org/2000/svg',
												children: _('g', {
													fill: 'none',
													fillRule: 'evenodd',
													children: [
														d('rect', {
															className: 'fill-current',
															width: '64',
															height: '64',
															rx: '32',
															style: { color: '#d93a10' },
														}),
														_('g', {
															strokeWidth: '2',
															children: [
																d('path', {
																	className: 'stroke-current text-white',
																	d: 'M32 37.714A5.714 5.714 0 0037.714 32a5.714 5.714 0 005.715 5.714',
																}),
																d('path', {
																	className: 'stroke-current text-white',
																	d: 'M32 37.714a5.714 5.714 0 015.714 5.715 5.714 5.714 0 015.715-5.715M20.571 26.286a5.714 5.714 0 005.715-5.715A5.714 5.714 0 0032 26.286',
																}),
																d('path', {
																	className: 'stroke-current text-white',
																	d: 'M20.571 26.286A5.714 5.714 0 0126.286 32 5.714 5.714 0 0132 26.286',
																}),
																d('path', {
																	className: 'stroke-current',
																	d: 'M21.714 40h4.572M24 37.714v4.572M37.714 24h4.572M40 21.714v4.572',
																	strokeLinecap: 'square',
																	style: { color: '#000' },
																}),
															],
														}),
													],
												}),
											}),
										}),
										d('h4', {
											className: 'text-lg font-bold leading-snug tracking-tight mb-1',
											children: 'Supply Chain Optimization 🌐',
										}),
										d('p', {
											className: 'text-gray-600 text-md',
											children:
												'Efficient supply chain management is the backbone of successful businesses. Our consultants work closely with you to optimize your supply chain, ensuring smooth and cost-effective operations. From inventory management to logistics optimization, we enhance your supply chain efficiency, ultimately contributing to your overall business success.',
										}),
									],
								}),
							],
						}),
					],
				}),
			}),
		],
	});
}
const e0 = '/assets/0017-931398f1.png';
function t0() {
	return _('section', {
		className: 'relative',
		children: [
			d('div', {
				className: 'absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none -mb-32',
				'aria-hidden': 'true',
				children: _('svg', {
					width: '1760',
					height: '518',
					viewBox: '0 0 1760 518',
					xmlns: 'http://www.w3.org/2000/svg',
					children: [
						d('defs', {
							children: _('linearGradient', {
								x1: '50%',
								y1: '0%',
								x2: '50%',
								y2: '100%',
								id: 'illustration-02',
								children: [
									d('stop', { stopColor: '#FFF', offset: '0%' }),
									d('stop', { stopColor: '#EAEAEA', offset: '77.402%' }),
									d('stop', { stopColor: '#DFDFDF', offset: '100%' }),
								],
							}),
						}),
						_('g', {
							transform: 'translate(0 -3)',
							fill: 'url(#illustration-02)',
							fillRule: 'evenodd',
							children: [
								d('circle', { cx: '1630', cy: '128', r: '128' }),
								d('circle', { cx: '178', cy: '481', r: '40' }),
							],
						}),
					],
				}),
			}),
			d('div', {
				className: 'max-w-6xl mx-auto px-4 sm:px-6',
				children: _('div', {
					className: 'py-12 md:py-20',
					children: [
						_('div', {
							className: 'max-w-4xl mx-auto text-center pb-12 md:pb-16',
							children: [
								d('h2', { className: 'h2 mb-4', children: 'Experts with 25+ years of experience' }),
								d('p', {
									className: 'text-xl text-gray-600',
									'data-aos': 'zoom-y-out',
									children:
										"Unlock your small manufacturing enterprise's potential with Pinata's seasoned experts, each boasting over 25 years of invaluable experience in MSME consulting services. Today, leverage our tailored guidance and expertise to conquer challenges and open doors to unparalleled opportunities. Our professionals, with deep industry insight, specialize in financial management, operational efficiency, strategic planning, marketing, and technology adoption. Let us be your trusted guide, propelling your success story forward and building a resilient future for your Indian small manufacturing enterprise. With Pinata's experts by your side, every step forward is a stride toward unlocking your business's immense potential. Choose confidence, choose Pinata.",
								}),
							],
						}),
						d('div', {
							className: 'max-w-sm md:max-w-4xl mx-auto grid gap-2',
							children: d('img', {
								className: 'relative md:max-w-none mx-auto rounded',
								src: e0,
								width: '800',
								height: '562',
								alt: 'Features bg',
							}),
						}),
					],
				}),
			}),
		],
	});
}
const mr = { _origin: 'https://api.emailjs.com' },
	n0 = (e, t = 'https://api.emailjs.com') => {
		((mr._userID = e), (mr._origin = t));
	},
	_f = (e, t, n) => {
		if (!e) throw 'The public key is required. Visit https://dashboard.emailjs.com/admin/account';
		if (!t) throw 'The service ID is required. Visit https://dashboard.emailjs.com/admin';
		if (!n) throw 'The template ID is required. Visit https://dashboard.emailjs.com/admin/templates';
		return !0;
	};
class qs {
	constructor(t) {
		((this.status = t ? t.status : 0), (this.text = t ? t.responseText : 'Network Error'));
	}
}
const Pf = (e, t, n = {}) =>
		new Promise((r, l) => {
			const i = new XMLHttpRequest();
			(i.addEventListener('load', ({ target: o }) => {
				const a = new qs(o);
				a.status === 200 || a.text === 'OK' ? r(a) : l(a);
			}),
				i.addEventListener('error', ({ target: o }) => {
					l(new qs(o));
				}),
				i.open('POST', mr._origin + e, !0),
				Object.keys(n).forEach(o => {
					i.setRequestHeader(o, n[o]);
				}),
				i.send(t));
		}),
	r0 = (e, t, n, r) => {
		const l = r || mr._userID;
		return (
			_f(l, e, t),
			Pf(
				'/api/v1.0/email/send',
				JSON.stringify({
					lib_version: '3.10.0',
					user_id: l,
					service_id: e,
					template_id: t,
					template_params: n,
				}),
				{ 'Content-type': 'application/json' },
			)
		);
	},
	l0 = e => {
		let t;
		if ((typeof e == 'string' ? (t = document.querySelector(e)) : (t = e), !t || t.nodeName !== 'FORM'))
			throw 'The 3rd parameter is expected to be the HTML form element or the style selector of form';
		return t;
	},
	i0 = (e, t, n, r) => {
		const l = r || mr._userID,
			i = l0(n);
		_f(l, e, t);
		const o = new FormData(i);
		return (
			o.append('lib_version', '3.10.0'),
			o.append('service_id', e),
			o.append('template_id', t),
			o.append('user_id', l),
			Pf('/api/v1.0/email/send-form', o)
		);
	},
	o0 = { init: n0, send: r0, sendForm: i0 };
function a0() {
	const [e, t] = L.useState(''),
		[n, r] = L.useState(!1);
	function l(i) {
		if (e.trim() !== '') {
			(i.preventDefault(), r(!0));
			var o = { to_name: 'Pinata', from_name: e };
			(o0.send('service_pvhk1dk', 'template_z32oftj', o, 'cP7kxt5F88IIaqTgE').then(
				function (a) {
					console.log('SUCCESS!', a.status, a.text);
				},
				function (a) {
					console.log('FAILED...', a);
				},
			),
				t(''));
		}
	}
	return d('section', {
		children: d('div', {
			className: 'max-w-6xl mx-auto px-4 sm:px-6',
			children: d('div', {
				className: 'pb-12 md:pb-20',
				children: _('div', {
					className: 'relative bg-gray-900 rounded py-10 px-8 md:py-16 md:px-12 shadow-2xl overflow-hidden',
					'data-aos': 'zoom-y-out',
					children: [
						d('div', {
							className: 'absolute right-0 bottom-0 pointer-events-none hidden lg:block',
							'aria-hidden': 'true',
							children: _('svg', {
								width: '428',
								height: '328',
								xmlns: 'http://www.w3.org/2000/svg',
								children: [
									d('defs', {
										children: _('radialGradient', {
											cx: '35.542%',
											cy: '34.553%',
											fx: '35.542%',
											fy: '34.553%',
											r: '96.031%',
											id: 'ni-a',
											children: [
												d('stop', { stopColor: '#DFDFDF', offset: '0%' }),
												d('stop', { stopColor: '#4C4C4C', offset: '44.317%' }),
												d('stop', { stopColor: '#333', offset: '100%' }),
											],
										}),
									}),
									_('g', {
										fill: 'none',
										fillRule: 'evenodd',
										children: [
											_('g', {
												fill: '#FFF',
												children: [
													d('ellipse', {
														fillOpacity: '.04',
														cx: '185',
														cy: '15.576',
														rx: '16',
														ry: '15.576',
													}),
													d('ellipse', {
														fillOpacity: '.24',
														cx: '100',
														cy: '68.402',
														rx: '24',
														ry: '23.364',
													}),
													d('ellipse', {
														fillOpacity: '.12',
														cx: '29',
														cy: '251.231',
														rx: '29',
														ry: '28.231',
													}),
													d('ellipse', {
														fillOpacity: '.64',
														cx: '29',
														cy: '251.231',
														rx: '8',
														ry: '7.788',
													}),
													d('ellipse', {
														fillOpacity: '.12',
														cx: '342',
														cy: '31.303',
														rx: '8',
														ry: '7.788',
													}),
													d('ellipse', {
														fillOpacity: '.48',
														cx: '62',
														cy: '126.811',
														rx: '2',
														ry: '1.947',
													}),
													d('ellipse', {
														fillOpacity: '.12',
														cx: '78',
														cy: '7.072',
														rx: '2',
														ry: '1.947',
													}),
													d('ellipse', {
														fillOpacity: '.64',
														cx: '185',
														cy: '15.576',
														rx: '6',
														ry: '5.841',
													}),
												],
											}),
											d('circle', { fill: 'url(#ni-a)', cx: '276', cy: '237', r: '200' }),
										],
									}),
								],
							}),
						}),
						d('div', {
							className: 'relative flex flex-col lg:flex-row justify-between items-center',
							children: _('div', {
								className: 'text-center lg:text-left lg:max-w-xl',
								children: [
									d('h3', {
										className: 'h3 text-white mb-2',
										children: 'Unleash the power of your Business',
									}),
									d('p', {
										className: 'text-gray-300 text-lg mb-6',
										children:
											"To learn more about how our Pinata Business Consulting services can benefit your organization, please feel free to reach out to us via email or phone. Our team is eagerly waiting to embark on this journey with you and help your MSME thrive in today's competitive market.",
									}),
									d('form', {
										className: 'w-full lg:w-auto',
										children: _('div', {
											className:
												'flex flex-col sm:flex-row justify-start max-w-xs mx-auto sm:max-w-md lg:mx-0',
											children: [
												!n &&
													d('input', {
														type: 'email',
														className:
															'form-input w-full appearance-none bg-gray-800 border border-gray-700 focus:border-gray-600 rounded-sm px-4 py-3 mb-2 sm:mb-0 sm:mr-2 text-white placeholder-gray-500',
														placeholder: 'Your email…',
														'aria-label': 'Your email…',
														onChange: i => t(i.target.value),
													}),
												d('a', {
													className:
														'btn text-white bg-orange-600 hover:bg-orange-500 shadow',
													href: '#0',
													onClick: l,
													children: n ? 'We will reach you back!' : 'Connect',
												}),
											],
										}),
									}),
								],
							}),
						}),
					],
				}),
			}),
		}),
	});
}
function s0() {
	return d('footer', {
		children: d('div', {
			className: 'max-w-6xl mx-auto px-4 sm:px-6',
			children: d('div', {
				className: 'md:flex md:items-center md:justify-between py-4 md:py-8 border-t border-gray-200',
				children: _('div', {
					className: 'text-sm text-gray-600 mr-4',
					children: [
						'Made by ',
						d('a', { className: 'text-orange-600 hover:underline', href: '/', children: 'Pinata' }),
						'. All rights reserved.',
					],
				}),
			}),
		}),
	});
}
function u0() {
	return _('div', {
		className: 'flex flex-col min-h-screen overflow-hidden',
		children: [
			d($h, {}),
			_('main', { className: 'flex-grow', children: [d(Uh, {}), d(Jh, {}), d(bh, {}), d(t0, {}), d(a0, {})] }),
			d(s0, {}),
		],
	});
}
function c0() {
	const e = kr();
	return (
		L.useEffect(() => {
			Fh.init({ once: !0, disable: 'phone', duration: 700, easing: 'ease-out-cubic' });
		}),
		L.useEffect(() => {
			((document.querySelector('html').style.scrollBehavior = 'auto'),
				window.scroll({ top: 0 }),
				(document.querySelector('html').style.scrollBehavior = ''));
		}, [e.pathname]),
		d(Zf, { children: d(Lm, { children: d(df, { exact: !0, path: '/', element: d(u0, {}) }) }) })
	);
}
Ci.createRoot(document.getElementById('root')).render(d(Be.StrictMode, { children: d(Mm, { children: d(c0, {}) }) }));
