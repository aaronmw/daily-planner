(window.webpackJsonp = window.webpackJsonp || []).push([
    [0],
    {
        29: function (n, t, e) {
            n.exports = e(68);
        },
        68: function (n, t, e) {
            'use strict';
            e.r(t);
            var a = e(6),
                c = e(2),
                o = e(5),
                r = e(0),
                i = e.n(r),
                s = e(22),
                u = e.n(s),
                l = e(1),
                d = e(23),
                p = e.n(d),
                f = e(3),
                b = { PRIMARY: '#0094FF', BACKGROUND: '#000209' };
            (b.BORDER_HOVER = Object(f.c)(0.5, '#0094FF')),
                (b.BORDER_IDLE = Object(f.c)(0.3, '#0094FF')),
                (b.SHADED = Object(f.a)(0.08, b.BACKGROUND)),
                (b.TEXT = Object(f.c)(0.85, '#0094FF')),
                (b.TEXT_FADED = Object(f.d)(0.5, b.TEXT)),
                (b.BORDER_NEUTRAL = Object(f.c)(0.15, b.TEXT));
            var m = { PRIMARY: '#0094FF', BACKGROUND: 'white' };
            (m.BORDER_HOVER = Object(f.b)('#0094FF', 0.5)),
                (m.BORDER_IDLE = Object(f.b)('#0094FF', 0.5)),
                (m.SHADED = Object(f.c)(0.95, m.PRIMARY)),
                (m.TEXT = Object(f.c)(0.15, '#0094FF')),
                (m.TEXT_FADED = Object(f.d)(0.4, m.TEXT)),
                (m.BORDER_NEUTRAL = Object(f.c)(0.75, m.BACKGROUND));
            var g = { DARK: b, LIGHT: m },
                v = [15, 30, 45, 60, 90, 120],
                h = {},
                O = '7:00',
                E = '24:00',
                j = 'transition: all 0.15s ease-in-out',
                x = l.d.div(function (n) {
                    var t = n.border,
                        e = void 0 !== t && t,
                        a = n.isFlexible,
                        c = void 0 !== a && a,
                        o = n.margin,
                        r = void 0 === o ? 0 : o,
                        i = n.marginX,
                        s = void 0 === i ? 0 : i,
                        u = n.marginY,
                        l = void 0 === u ? 0 : u,
                        d = n.padding,
                        p = void 0 === d ? 0 : d,
                        f = n.paddingX,
                        b = void 0 === f ? 0 : f,
                        m = n.paddingY,
                        v = void 0 === m ? 0 : m,
                        h = n.theme;
                    return '\n        box-shadow: '
                        .concat(
                            e
                                ? '0 0 0 1px '.concat(g[h.name].BORDER_NEUTRAL)
                                : 'none',
                            ';\n        flex-grow: '
                        )
                        .concat(c ? 1 : 0, ';\n        flex-shrink: ')
                        .concat(c ? 1 : 0, ';\n        ')
                        .concat(
                            s
                                ? '\n                    margin-left: calc('
                                      .concat(s, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    margin-right: calc('
                                      )
                                      .concat(s, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            l
                                ? '\n                    margin-top: calc('
                                      .concat(l, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    margin-bottom: calc('
                                      )
                                      .concat(l, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            r
                                ? '\n                    margin: calc('
                                      .concat(r, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            b
                                ? '\n                    padding-left: calc('
                                      .concat(b, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    padding-right: calc('
                                      )
                                      .concat(b, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            v
                                ? '\n                    padding-top: calc('
                                      .concat(v, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    padding-bottom: calc('
                                      )
                                      .concat(v, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            p
                                ? '\n                    padding: calc('
                                      .concat(p, ' * ')
                                      .concat('30px', ');\n                ')
                                : '',
                            '\n    '
                        );
                }),
                D = Object(l.d)(x)(function (n) {
                    var t = n.align,
                        e = void 0 === t ? 'center' : t,
                        a = n.direction,
                        c = void 0 === a ? 'row' : a,
                        o = n.justify,
                        r = void 0 === o ? 'stretch' : o,
                        i = n.spacing,
                        s = void 0 === i ? 0 : i;
                    return '\n        align-items: '
                        .concat(
                            e,
                            ';\n        display: flex;\n        flex-direction: '
                        )
                        .concat(c, ';\n        justify-content: ')
                        .concat(
                            r,
                            ';\n        width: 100%;\n        \n        '
                        )
                        .concat(
                            s
                                ? '\n                    & > * + * {\n                        margin-'
                                      .concat(
                                          'row' === c ? 'left' : 'top',
                                          ': calc('
                                      )
                                      .concat(s, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    }\n                '
                                      )
                                : '',
                            '\n    '
                        );
                }),
                R = e(4),
                T = function (n, t) {
                    var e = Object(r.useState)(!1),
                        a = Object(c.a)(e, 2),
                        o = a[0],
                        i = a[1];
                    return [
                        {
                            isTargetedForDrop: o,
                            droppable: !0,
                            onDragEnter: function (n) {
                                n.preventDefault(), i(!0);
                            },
                            onDragOver: function (n) {
                                n.preventDefault();
                            },
                            onDragLeave: function () {
                                i(!1);
                            },
                            onDrop: function (e) {
                                var a = e.dataTransfer.getData(n);
                                a && t(isNaN(a) ? a : parseFloat(a)), i(!1);
                            },
                        },
                    ];
                };
            function k() {
                var n = Object(o.a)([
                    '\n        animation-direction: alternate;\n        animation-duration: 300ms;\n        animation-iteration-count: infinite;\n        animation-name: ',
                    ';\n        animation-timing-function: ease-in-out;\n        background: ',
                    ';\n        bottom: calc(',
                    ' * -',
                    ');\n        border-radius: calc(',
                    ' * 2);\n        height: calc(',
                    ' * 2);\n        pointer-events: ',
                    ';\n        position: fixed;\n        right: calc(',
                    ' * -',
                    ');\n        transform: scale(0.5);\n        width: calc(',
                    ' * 2);\n        z-index: 100;\n        ',
                    ";\n\n        &:before {\n            align-items: center;\n            content: '\ud83c\udfc1';\n            display: flex;\n            font-size: 8rem;\n            justify-content: center;\n            height: calc(",
                    ' * 1.25);\n            left: 0;\n            position: absolute;\n            top: 0;\n            width: calc(',
                    ' * 1.25);\n        }\n    ',
                ]);
                return (
                    (k = function () {
                        return n;
                    }),
                    n
                );
            }
            function w() {
                var n = Object(o.a)([
                    '\n    0% {\n        box-shadow: 0 0 0 0 ',
                    ';\n        transform: scale(1);\n    }\n    100% {\n        box-shadow: 0 0 50px 0 ',
                    ';\n        transform: scale(1.2);\n    }\n',
                ]);
                return (
                    (w = function () {
                        return n;
                    }),
                    n
                );
            }
            var A = function (n) {
                    var t = n.theme;
                    return Object(l.e)(
                        w(),
                        g[t.name].PRIMARY,
                        g[t.name].PRIMARY
                    );
                },
                y = l.d.div(function (n) {
                    var t = n.isDragging,
                        e = n.isTargetedForDrop,
                        a = n.theme;
                    return Object(l.c)(
                        k(),
                        e ? A : 'unset',
                        Object(f.d)(e ? 0 : t ? 0.75 : 1, g[a.name].PRIMARY),
                        '20vw',
                        t ? 1 : 2,
                        '20vw',
                        '20vw',
                        t ? 'all' : 'none',
                        '20vw',
                        t ? 1 : 2,
                        '20vw',
                        j,
                        '20vw',
                        '20vw'
                    );
                }),
                S = function (n) {
                    var t = n.appActions,
                        e = n.isDragging,
                        a = Object(R.a)(n, ['appActions', 'isDragging']),
                        o = t.onSelectTask,
                        r = t.onUpdateTask,
                        s = T('task-id', function (n) {
                            r(n, { isComplete: !0 }),
                                o(function (t) {
                                    return (
                                        console.log(t, 'v', n),
                                        t === n ? null : t
                                    );
                                });
                        }),
                        u = Object(c.a)(s, 1)[0];
                    return i.a.createElement(
                        y,
                        Object.assign({ isDragging: e }, u, a)
                    );
                },
                F = Object(l.d)(x).attrs({
                    as: 'button',
                    paddingX: 0.5,
                    paddingY: 0.25,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background: '
                        .concat(g[t.name].PRIMARY, ';\n        border-radius: ')
                        .concat('3px', ';\n        color: ')
                        .concat(
                            g[t.name].TEXT,
                            ';\n        cursor: pointer;\n        transform: scale(1);\n        '
                        )
                        .concat(
                            j,
                            ';\n        \n        &:focus,\n        &:hover {\n            transform: scale(1.1);\n        }\n        &:active {\n            transform: scale(0.9);\n            filter: hue-rotate(20deg);\n        }\n    '
                        );
                }),
                I = Object(l.d)(F)(function (n) {
                    var t = n.theme;
                    return '\n        background: unset; \n        border-radius: '
                        .concat('3px', ';\n        border: 2px dashed ')
                        .concat(
                            g[t.name].BORDER_IDLE,
                            ';\n        width: 100%;\n        \n        &:focus,\n        &:hover {\n            border-color: '
                        )
                        .concat(g[t.name].BORDER_HOVER, ';\n        }\n    ');
                }),
                _ = F,
                M = Object(l.d)(D).attrs({
                    justify: 'space-between',
                    paddingX: 1,
                    paddingY: 0.25,
                    spacing: 0.5,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background: '
                        .concat(
                            Object(f.d)(0.5, g[t.name].SHADED),
                            ';\n        color: '
                        )
                        .concat(
                            g[t.name].TEXT_FADED,
                            ';\n        \n        &:hover {\n            color: '
                        )
                        .concat(g[t.name].TEXT, ';\n        }\n    ');
                }),
                C = Object(l.d)(_)(function (n) {
                    var t = n.isSelected;
                    n.theme;
                    return '\n        background: transparent;\n        color: inherit;\n        font-weight: '
                        .concat(t ? 900 : 100, ';\n        opacity: ')
                        .concat(t ? 1 : 0, ';\n        ')
                        .concat(j, ';\n        \n        ')
                        .concat(
                            M,
                            ':hover > & {\n            opacity: 1;\n        }\n    '
                        );
                }),
                B = function (n) {
                    var t = n.options,
                        e = n.renderOption,
                        a =
                            void 0 === e
                                ? function (n) {
                                      return n;
                                  }
                                : e,
                        c = n.renderSelectedOption,
                        o =
                            void 0 === c
                                ? function (n) {
                                      return n;
                                  }
                                : c,
                        r = n.selectedOption,
                        s = n.onChange,
                        u = Object(R.a)(n, [
                            'options',
                            'renderOption',
                            'renderSelectedOption',
                            'selectedOption',
                            'onChange',
                        ]);
                    return i.a.createElement(
                        M,
                        u,
                        t.map(function (n) {
                            var t = n === r;
                            return i.a.createElement(
                                C,
                                {
                                    key: n,
                                    isSelected: t,
                                    onClick: function () {
                                        return s(n);
                                    },
                                },
                                t ? o(a(n)) : a(n)
                            );
                        })
                    );
                },
                L = e(26),
                X = e.n(L),
                U = Object(l.d)(x)(function (n) {
                    var t = n.isEditing,
                        e = n.isEmpty,
                        a = n.theme;
                    return '\n        cursor: '
                        .concat(
                            t ? 'text' : 'pointer',
                            ';\n        position: relative;\n        opacity: '
                        )
                        .concat(e ? 0.5 : 1, ';\n        user-select: ')
                        .concat(
                            t ? 'text' : 'none',
                            ';\n    \n        // Tracing element\n        &:before {\n            border: 2px dashed '
                        )
                        .concat(
                            g[a.name].BORDER_HOVER,
                            ';\n            border-radius: '
                        )
                        .concat(
                            '3px',
                            ";\n            content: '';\n            opacity: "
                        )
                        .concat(
                            t ? 1 : 0,
                            ';\n            pointer-events: none;\n            position: absolute;\n            top: calc('
                        )
                        .concat(
                            '30px',
                            ' * 0.5 * -1);\n            right: calc('
                        )
                        .concat(
                            '30px',
                            ' * 0.5 * -1);\n            bottom: calc('
                        )
                        .concat(
                            '30px',
                            ' * 0.5 * -1);\n            left: calc('
                        )
                        .concat('30px', ' * 0.5 * -1);\n            ')
                        .concat(
                            j,
                            ';\n        }\n        \n        &:hover {\n            &:before {\n                opacity: 1;\n            }\n        }\n    '
                        );
                }),
                N = function (n) {
                    var t = n.isMultiLine,
                        e = void 0 !== t && t,
                        a = n.placeholder,
                        o = void 0 === a ? 'Empty' : a,
                        s = n.render,
                        u =
                            void 0 === s
                                ? function (n) {
                                      return n;
                                  }
                                : s,
                        l = n.value,
                        d = void 0 === l ? '' : l,
                        p = n.onSave,
                        f = void 0 === p ? function () {} : p,
                        b = Object(R.a)(n, [
                            'isMultiLine',
                            'placeholder',
                            'render',
                            'value',
                            'onSave',
                        ]),
                        m = Object(r.useState)(!1),
                        g = Object(c.a)(m, 2),
                        v = g[0],
                        h = g[1],
                        O = Object(r.useState)(d),
                        E = Object(c.a)(O, 2),
                        j = E[0],
                        x = E[1],
                        D = Object(r.useState)(null),
                        T = Object(c.a)(D, 2),
                        k = T[0],
                        w = T[1],
                        A = Object(r.useRef)(null),
                        y = Object(r.useRef)(null),
                        S = '' === d.trim();
                    Object(r.useEffect)(
                        function () {
                            x(d);
                        },
                        [d]
                    ),
                        Object(r.useEffect)(
                            function () {
                                v &&
                                    A.current &&
                                    (A.current.select(), A.current.focus());
                            },
                            [A, v]
                        ),
                        Object(r.useEffect)(
                            function () {
                                var n = y.current;
                                n && w(n.offsetHeight);
                            },
                            [j, v, y]
                        );
                    return i.a.createElement(
                        U,
                        Object.assign(
                            {
                                isEditing: v,
                                isEmpty: S,
                                onDoubleClick: function () {
                                    x(d), h(!0);
                                },
                            },
                            b
                        ),
                        v
                            ? i.a.createElement(
                                  i.a.Fragment,
                                  null,
                                  i.a.createElement(
                                      'div',
                                      {
                                          ref: y,
                                          style: {
                                              position: 'absolute',
                                              pointerEvents: 'none',
                                              opacity: 0,
                                              outline: '2px dotted red',
                                              whiteSpace: 'pre-wrap',
                                              width: '100%',
                                          },
                                      },
                                      j,
                                      '.'
                                  ),
                                  i.a.createElement('textarea', {
                                      disabled: !v,
                                      ref: A,
                                      rows: 1,
                                      style: {
                                          display: 'block',
                                          height: ''.concat(k, 'px'),
                                          width: '100%',
                                      },
                                      value: j,
                                      onBlur: function () {
                                          h(!1);
                                      },
                                      onChange: function (n) {
                                          x(n.target.value);
                                      },
                                      onKeyDown: function (n) {
                                          return 'Escape' === n.key
                                              ? (x(d), void h(!1))
                                              : 'Enter' !== n.key ||
                                                ((n.metaKey ||
                                                    n.shiftKey ||
                                                    !e) &&
                                                    (f(j), h(!1)),
                                                e)
                                              ? void 0
                                              : (n.preventDefault(), !1);
                                      },
                                  })
                              )
                            : u(S ? o : d)
                    );
                };
            function Y() {
                var n = Object(o.a)([
                    '\n    flex-shrink: 0;\n    font-size: 3rem;\n    line-height: 1.4rem;\n    width: 3rem;\n',
                ]);
                return (
                    (Y = function () {
                        return n;
                    }),
                    n
                );
            }
            function H() {
                var n = Object(o.a)([
                    '\n    flex-grow: 1;\n    justify-self: stretch;\n',
                ]);
                return (
                    (H = function () {
                        return n;
                    }),
                    n
                );
            }
            var z = l.d.div(function (n) {
                    var t = n.isLoading,
                        e = n.theme;
                    return '\n        display: flex;\n        flex-direction: column;\n        position: relative;\n        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1);\n        border-left: 2px solid '
                        .concat(
                            g[e.name].BORDER_NEUTRAL,
                            ';\n        border-right: 2px solid '
                        )
                        .concat(
                            g[e.name].BORDER_NEUTRAL,
                            ';\n        z-index: 1;\n        \n        &:before {\n            background-color: '
                        )
                        .concat(
                            g[e.name].BACKGROUND,
                            ";\n            bottom: 0;\n            content: '';\n            left: 0;\n            opacity: "
                        )
                        .concat(
                            t ? 1 : 0,
                            ';\n            pointer-events: none;\n            position: absolute;\n            right: 0;\n            top: 0;\n            transition: opacity '
                        )
                        .concat(
                            0.1,
                            's ease-in-out;\n            z-index: 10;\n        }\n    '
                        );
                }),
                K = Object(l.d)(D).attrs({
                    as: 'h1',
                    align: 'flex-start',
                    spacing: 1.5,
                    paddingX: 1,
                    paddingY: 0.75,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '.concat(
                        g[t.name].SHADED,
                        ';\n        font-size: 1.4rem;\n        font-weight: 900;\n        position: relative;\n    '
                    );
                }),
                P = Object(l.d)(x).attrs({ role: 'image' })(H()),
                G = Object(l.d)(x).attrs({ role: 'img' })(Y()),
                V = function (n) {
                    var t = n.appActions,
                        e = n.task,
                        a = void 0 === e ? {} : e,
                        o = Object(R.a)(n, ['appActions', 'task']),
                        s = Object(r.useState)(!1),
                        u = Object(c.a)(s, 2),
                        l = u[0],
                        d = u[1],
                        p = t.onUpdateTask,
                        f = a.icon,
                        b = a.id,
                        m = a.label,
                        g = a.notes,
                        h = a.scheduled_minutes,
                        O = !a.id,
                        E = function (n, t) {
                            return p(b, { [n]: t });
                        };
                    return (
                        Object(r.useLayoutEffect)(
                            function () {
                                d(!0);
                                var n = setTimeout(function () {
                                    return d(!1);
                                }, 100);
                                return function () {
                                    return clearTimeout(n);
                                };
                            },
                            [a.id]
                        ),
                        i.a.createElement(
                            z,
                            Object.assign({ isLoading: l }, o),
                            !O &&
                                !l &&
                                i.a.createElement(
                                    i.a.Fragment,
                                    null,
                                    i.a.createElement(B, {
                                        renderSelectedOption: function (n) {
                                            return ''.concat(n, ' mins');
                                        },
                                        selectedOption: h,
                                        options: v,
                                        onChange: function (n) {
                                            return E('scheduled_minutes', n);
                                        },
                                    }),
                                    i.a.createElement(
                                        K,
                                        null,
                                        i.a.createElement(
                                            P,
                                            null,
                                            i.a.createElement(N, {
                                                placeholder: 'Untitled',
                                                value: m,
                                                onSave: function (n) {
                                                    return E('label', n);
                                                },
                                            })
                                        ),
                                        i.a.createElement(
                                            G,
                                            null,
                                            i.a.createElement(N, {
                                                placeholder: '\ud83d\udccc',
                                                value: f,
                                                onSave: function (n) {
                                                    return E('icon', n);
                                                },
                                            })
                                        )
                                    ),
                                    i.a.createElement(N, {
                                        isMultiLine: !0,
                                        margin: 1,
                                        placeholder:
                                            'Double-click to add notes',
                                        render: function (n) {
                                            return i.a.createElement('div', {
                                                className: 'markdown',
                                                dangerouslySetInnerHTML: {
                                                    __html: X()(n),
                                                },
                                            });
                                        },
                                        value: g,
                                        onSave: function (n) {
                                            return E('notes', n);
                                        },
                                    })
                                )
                        )
                    );
                },
                q = e(9),
                J = e.n(q),
                Q = function (n) {
                    return '\n    max(\n        100vh / ('
                        .concat(8, ' * 60) * ')
                        .concat(n, ',\n        ')
                        .concat('20px', ' * 2 * ')
                        .concat(n, ' / 60\n    )\n');
                },
                W = function (n) {
                    return n
                        ? n.split(':').map(function (n) {
                              return parseInt(n, 10);
                          })
                        : [0, 0];
                },
                Z = function (n, t) {
                    var e = Object(r.useState)(!1),
                        a = Object(c.a)(e, 2),
                        o = a[0],
                        i = a[1],
                        s = Object(r.useState)(!1),
                        u = Object(c.a)(s, 2),
                        l = u[0],
                        d = u[1];
                    return [
                        {
                            draggable: !0,
                            isDragging: o,
                            isDraggingOver: l,
                            onDragEnd: function () {
                                i(!1), d(!1);
                            },
                            onDragEnter: function () {
                                return d(!0);
                            },
                            onDragLeave: function () {
                                return d(!1);
                            },
                            onDragStart: function (e) {
                                e.dataTransfer.setData(n, t), i(!0);
                            },
                        },
                    ];
                },
                $ = l.d.div(function (n) {
                    var t = n.duration,
                        e = n.isActive,
                        a = n.isDragging,
                        c = n.isDraggingOver,
                        o = n.theme;
                    return '\n        align-items: center;\n        background-color: '
                        .concat(
                            g[o.name].BACKGROUND,
                            ';\n        border-radius: '
                        )
                        .concat(
                            '3px',
                            ';\n        box-shadow: ',
                            '0 0 0 2px '.concat(
                                g[o.name][e ? 'PRIMARY' : 'BORDER_IDLE']
                            ),
                            ';\n        cursor: pointer;\n        height: '
                        )
                        .concat(Q(t), ';\n        opacity: ')
                        .concat(a ? 0.5 : 1, ';\n        padding: 0 calc(')
                        .concat('30px', ' / 2) 0\n            calc(')
                        .concat('30px', ' / 2 + ')
                        .concat('5px', ');\n        pointer-events: ')
                        .concat(
                            c ? 'none' : 'auto',
                            ';\n        position: relative;\n        transition-property: opacity, top;\n        width: auto;\n        z-index: '
                        )
                        .concat(e ? 10 : 'initial', ';\n        ')
                        .concat(
                            j,
                            ';\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            g[o.name].PRIMARY,
                            ';\n            border-bottom-left-radius: '
                        )
                        .concat(
                            '3px',
                            ';\n            border-top-left-radius: '
                        )
                        .concat(
                            '3px',
                            ";\n            bottom: 1px;\n            content: '';\n            left: 1px;\n            opacity: "
                        )
                        .concat(
                            e ? 1 : 0.5,
                            ';\n            position: absolute;\n            top: 1px;\n            width: '
                        )
                        .concat('5px', ';\n            ')
                        .concat(
                            j,
                            ';\n        }\n        \n        &:hover {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            g[o.name].BORDER_HOVER,
                            ';\n        }\n        \n        &:focus {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            g[o.name].PRIMARY,
                            ';\n        }\n        \n        &:active {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(g[o.name].PRIMARY, ' inset;\n        }\n    ');
                }),
                nn = l.d.div(function (n) {
                    var t = n.isActive,
                        e = n.theme;
                    return '\n        align-items: center;\n        color: '
                        .concat(
                            g[e.name][t ? 'TEXT' : 'TEXT_FADED'],
                            ';\n        display: flex;\n        height: 100%;\n        justify-content: space-between;\n        max-height: calc((100vh / ('
                        )
                        .concat(8, ' * 60)) * 30);\n        min-height: ')
                        .concat('20px', ';\n        ')
                        .concat(j, ';\n        \n        ')
                        .concat($, ':hover > & {\n            color: ')
                        .concat(g[e.name].TEXT, ';\n        }\n    ');
                }),
                tn = function (n) {
                    var t = n.appActions,
                        e = n.isActive,
                        a = n.task,
                        o = Object(R.a)(n, ['appActions', 'isActive', 'task']),
                        r = t.onSelectTask,
                        s = a.icon,
                        u = a.id,
                        l = a.label,
                        d = a.scheduled_minutes,
                        p = Z('task-id', u),
                        f = Object(c.a)(p, 1)[0];
                    return i.a.createElement(
                        $,
                        Object.assign(
                            {
                                duration: d,
                                isActive: e,
                                onClick: function () {
                                    return r(u);
                                },
                            },
                            f,
                            o
                        ),
                        i.a.createElement(
                            nn,
                            { isActive: e },
                            i.a.createElement(
                                'div',
                                {
                                    style: {
                                        maxHeight: '100%',
                                        overflow: 'auto',
                                    },
                                },
                                l
                            ),
                            i.a.createElement('span', null, s)
                        )
                    );
                };
            function en() {
                var n = Object(o.a)([
                    '\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n',
                ]);
                return (
                    (en = function () {
                        return n;
                    }),
                    n
                );
            }
            var an = l.d.div(en()),
                cn = l.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        position: relative;\n        width: 100%;\n        height: '
                        .concat(
                            Q(15),
                            ';\n        z-index: 1;\n        border-top: '
                        )
                        .concat(
                            t ? '4px dotted '.concat(g[e.name].PRIMARY) : '',
                            ';\n    '
                        );
                }),
                on = function (n) {
                    var t,
                        e = n.appActions,
                        a = n.quarterInMinutes,
                        o = Object(R.a)(n, ['appActions', 'quarterInMinutes']),
                        r = e.onUpdateTask,
                        s = W(O),
                        u = Object(c.a)(s, 2),
                        l = u[0],
                        d = u[1],
                        p =
                            ((t = 60 * l + d + 15 * a),
                            ''.concat(Math.floor(t / 60), ':').concat(t % 60)),
                        f = T('task-id', function (n) {
                            return r(n, { scheduled: !0, scheduled_time: p });
                        }),
                        b = Object(c.a)(f, 1)[0];
                    return i.a.createElement(cn, Object.assign({}, b, o));
                },
                rn = function (n) {
                    var t = n.appActions,
                        e = n.totalMinutes,
                        a = Object(R.a)(n, ['appActions', 'totalMinutes']);
                    return i.a.createElement(
                        an,
                        a,
                        J()(e / 15).map(function (n) {
                            return i.a.createElement(on, {
                                key: n,
                                appActions: t,
                                quarterInMinutes: n,
                            });
                        })
                    );
                };
            function sn() {
                var n = Object(o.a)([
                    '\n    position: relative;\n    height: ',
                    ';\n',
                ]);
                return (
                    (sn = function () {
                        return n;
                    }),
                    n
                );
            }
            function un() {
                var n = Object(o.a)([
                    '\n    height: 100vh;\n    overflow: auto;\n    position: relative;\n    user-select: none;\n',
                ]);
                return (
                    (un = function () {
                        return n;
                    }),
                    n
                );
            }
            var ln = l.d.div(un()),
                dn = l.d.div(sn(), Q(30)),
                pn = l.d.div(function (n) {
                    var t = n.hideLabel,
                        e = n.isFaded,
                        a = n.theme;
                    return '\n        color: '
                        .concat(
                            t
                                ? 'transparent'
                                : Object(f.d)(e ? 1 : 0, g[a.name].TEXT_FADED),
                            ';\n        padding-right: calc(100% - '
                        )
                        .concat('80px', ' + (')
                        .concat(
                            '30px',
                            ' * 0.5));\n        position: absolute;\n        text-align: right;\n        top: 0;\n        transform: translateY(-50%);\n        width: 100%;\n    \n        &:before {\n            background-color: '
                        )
                        .concat(
                            Object(f.d)(
                                e ? 0.8 : 0.5,
                                g[a.name].BORDER_NEUTRAL
                            ),
                            ";\n            content: '';\n            height: 1px;\n            left: "
                        )
                        .concat(
                            '80px',
                            ';\n            position: absolute;\n            right: 0;\n            top: 50%;\n        }\n    '
                        );
                }),
                fn = Object(l.d)(tn)(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        position: absolute;\n        left: calc('
                        .concat('30px', ' * 3);\n        right: ')
                        .concat('30px', ';\n        top: ')
                        .concat(Q(t), ';\n        z-index: 2;\n    ');
                }),
                bn = l.d.div(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        background-color: red;\n        height: 1px;\n        left: 0;\n        pointer-events: none;\n        position: absolute;\n        right: 0;\n        top: '.concat(
                        Q(t),
                        ';\n        z-index: 10;\n    '
                    );
                }),
                mn = function (n) {
                    var t = n.appActions,
                        e = n.selectedTaskId,
                        a = n.from,
                        o = n.tasks,
                        s = n.to,
                        u =
                            (n.onClickTask,
                            Object(R.a)(n, [
                                'appActions',
                                'selectedTaskId',
                                'from',
                                'tasks',
                                'to',
                                'onClickTask',
                            ])),
                        l = Object(r.useState)(null),
                        d = Object(c.a)(l, 2),
                        p = d[0],
                        f = d[1],
                        b = W(p),
                        m = Object(c.a)(b, 2),
                        g = m[0],
                        v = m[1],
                        h = W(a),
                        O = Object(c.a)(h, 2),
                        E = O[0],
                        j = O[1],
                        x = Object(r.useState)(!1),
                        D = Object(c.a)(x, 2),
                        T = D[0],
                        k = D[1],
                        w = W(s),
                        A = Object(c.a)(w, 2),
                        y = A[0],
                        S = A[1],
                        F = y - E,
                        I = 60 * y + S - (60 * E + j),
                        _ = Object(r.useRef)(null),
                        M = Object(r.useRef)(null);
                    return (
                        Object(r.useEffect)(function () {
                            var n = function () {
                                var n = new Date();
                                f(
                                    ''
                                        .concat(n.getHours(), ':')
                                        .concat(n.getMinutes())
                                ),
                                    k(!0);
                            };
                            n();
                            var t = setInterval(n, 500);
                            return function () {
                                return clearInterval(t);
                            };
                        }, []),
                        Object(r.useEffect)(
                            function () {
                                T &&
                                    _.current &&
                                    M.current &&
                                    M.current.scrollTo(
                                        0,
                                        _.current.offsetTop - 150
                                    );
                            },
                            [T, _, M]
                        ),
                        i.a.createElement(
                            ln,
                            Object.assign({ ref: M }, u),
                            o.map(function (n) {
                                var a = W(n.scheduled_time),
                                    o = Object(c.a)(a, 2),
                                    r = 60 * o[0] + o[1] - (60 * E + j);
                                return i.a.createElement(fn, {
                                    key: n.id,
                                    appActions: t,
                                    isActive: e === n.id,
                                    offsetMinutes: r,
                                    task: n,
                                });
                            }),
                            i.a.createElement(bn, {
                                ref: _,
                                offsetMinutes: 60 * g + v - (60 * E + j),
                            }),
                            i.a.createElement(rn, {
                                appActions: t,
                                totalMinutes: I,
                            }),
                            J()(F).map(function (n) {
                                return i.a.createElement(
                                    r.Fragment,
                                    { key: n },
                                    i.a.createElement(
                                        dn,
                                        null,
                                        i.a.createElement(
                                            pn,
                                            { hideLabel: 0 === n },
                                            (E + n) % 12 || 12,
                                            ':00'
                                        )
                                    ),
                                    i.a.createElement(
                                        dn,
                                        null,
                                        i.a.createElement(
                                            pn,
                                            { isFaded: !0 },
                                            (E + n) % 12 || 12,
                                            ':30'
                                        )
                                    )
                                );
                            })
                        )
                    );
                };
            function gn() {
                var n = Object(o.a)([
                    '\n    position: absolute;\n    right: calc(100% + ',
                    ' * 2);\n    top: 50%;\n    transform: translateY(-50%);\n    white-space: nowrap;\n',
                ]);
                return (
                    (gn = function () {
                        return n;
                    }),
                    n
                );
            }
            var vn = Object(l.d)(D).attrs({
                    align: 'stretch',
                    direction: 'column',
                    justify: 'flex-start',
                    padding: 1,
                    spacing: 1,
                })(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        background-color: '
                        .concat(g[e.name].SHADED, ';\n        box-shadow: ')
                        .concat(
                            t
                                ? '0 0 0 5px '.concat(
                                      g[e.name].BORDER_HOVER,
                                      ' inset'
                                  )
                                : 'initial',
                            ';\n        flex-grow: 1;\n    '
                        );
                }),
                hn = Object(l.d)(x)(gn(), '30px'),
                On = function (n) {
                    var t = n.appActions,
                        e = n.selectedTaskId,
                        a = n.tasks,
                        o =
                            (n.onClickTask,
                            Object(R.a)(n, [
                                'appActions',
                                'selectedTaskId',
                                'tasks',
                                'onClickTask',
                            ])),
                        r = t.onSelectTask,
                        s = t.onUpdateTask,
                        u = t.onUpdateTasks,
                        l = T('task-id', function (n) {
                            return s(n, { scheduled: !1 });
                        }),
                        d = Object(c.a)(l, 1)[0];
                    return i.a.createElement(
                        vn,
                        Object.assign({}, d, o),
                        i.a.createElement(
                            'div',
                            { style: { position: 'relative', width: '100%' } },
                            0 === a.length &&
                                i.a.createElement(
                                    hn,
                                    null,
                                    'Create your first task',
                                    ' ',
                                    i.a.createElement(
                                        'span',
                                        {
                                            role: 'img',
                                            'aria-label': 'right-pointing hand',
                                        },
                                        '\ud83d\udc49'
                                    )
                                ),
                            i.a.createElement(
                                I,
                                {
                                    style: { height: Q(30) },
                                    onClick: function () {
                                        var n = Date.now(),
                                            t = new Date(),
                                            e = t.getHours(),
                                            a = t.getMinutes();
                                        u({
                                            [n]: {
                                                icon: '\ud83d\udccc',
                                                id: n,
                                                isComplete: !1,
                                                label: 'New Task',
                                                notes: '',
                                                scheduled: !1,
                                                scheduled_minutes: 30,
                                                scheduled_time: ''
                                                    .concat(e, ':')
                                                    .concat(a),
                                            },
                                        }),
                                            r(n);
                                    },
                                },
                                'New Task'
                            )
                        ),
                        a.map(function (n) {
                            return i.a.createElement(tn, {
                                key: n.id,
                                appActions: t,
                                isActive: e === n.id,
                                task: n,
                            });
                        })
                    );
                },
                En = function (n, t) {
                    var e = Object(r.useState)(!1),
                        a = Object(c.a)(e, 2),
                        o = a[0],
                        i = a[1],
                        s = Object(r.useState)(t),
                        u = Object(c.a)(s, 2),
                        l = u[0],
                        d = u[1];
                    return (
                        Object(r.useEffect)(
                            function () {
                                if (!o) {
                                    var e = window.localStorage.getItem(n);
                                    d(JSON.parse(e) || t), i(!0);
                                }
                            },
                            [n, t, o]
                        ),
                        Object(r.useEffect)(
                            function () {
                                o &&
                                    window.localStorage.setItem(
                                        n,
                                        JSON.stringify(l)
                                    );
                            },
                            [o, n, l]
                        ),
                        [l, d]
                    );
                };
            function jn() {
                var n = Object(o.a)(['\n    display: flex;\n']);
                return (
                    (jn = function () {
                        return n;
                    }),
                    n
                );
            }
            var xn = Object(l.b)(function (n) {
                    var t = n.theme;
                    return '\n        * {\n            background: unset;\n            border: unset;\n            box-sizing: border-box;\n            color: unset;\n            font: unset;\n            line-height: 1.25em;\n            list-style-type: none;\n            margin: 0;\n            outline: unset;\n            padding: 0;\n        }\n        :root {\n            background: '
                        .concat(g[t.name].BACKGROUND, ';\n            color: ')
                        .concat(
                            g[t.name].TEXT,
                            ";\n            font-family: 'Operator Mono', monospace;\n            font-weight: 300;\n            height: 100%;\n            overflow: hidden;\n        }\n        strong {\n            font-weight: 900;\n        }\n        em {\n            font-style: italic;\n        }\n        \n        .markdown {\n            * + * {\n                margin-top: calc("
                        )
                        .concat(
                            '30px',
                            ' * 0.5);\n            }\n            \n            h1 {\n                color: '
                        )
                        .concat(
                            g[t.name].TEXT_FADED,
                            ';\n                font-size: 1.4rem;\n                font-weight: 500;\n                border-bottom: 2px dotted '
                        )
                        .concat(
                            g[t.name].TEXT_FADED,
                            ';\n                padding-bottom: calc('
                        )
                        .concat(
                            '30px',
                            ' * 0.25);\n                \n                & + * {\n                    margin-top: '
                        )
                        .concat(
                            '30px',
                            ';\n                } \n            }\n        \n            blockquote {\n                border-left: 2px dotted '
                        )
                        .concat(
                            g[t.name].TEXT_FADED,
                            ';\n                font-style: italic;\n                padding: calc('
                        )
                        .concat('30px', ' * 0.5) ')
                        .concat(
                            '30px',
                            ';\n            }\n        \n            li {\n                margin-top: calc('
                        )
                        .concat(
                            '30px',
                            ' / 4);\n                padding-left: '
                        )
                        .concat(
                            '30px',
                            ";\n                position: relative;\n        \n                &:before {\n                    content: '';\n                    box-sizing: border-box;\n                    position: absolute;\n                    top: 5px;\n                    left: 0;\n                    border: 2px dotted "
                        )
                        .concat(
                            g[t.name].TEXT_FADED,
                            ';\n                    border-radius: 100px;\n                    width: '
                        )
                        .concat('10px', ';\n                    height: ')
                        .concat(
                            '10px',
                            ';\n                }\n            }\n        }\n    '
                        );
                }),
                Dn = l.d.div(jn());
            function Rn() {
                var n = En('tasks', h),
                    t = Object(c.a)(n, 2),
                    e = t[0],
                    o = t[1],
                    s = En('theme', { name: 'DARK' }),
                    u = Object(c.a)(s, 2),
                    d = u[0],
                    f = u[1],
                    b = En('selected-task-id', null),
                    m = Object(c.a)(b, 2),
                    g = m[0],
                    v = m[1],
                    j = Object(r.useState)(!1),
                    x = Object(c.a)(j, 2),
                    R = x[0],
                    T = x[1],
                    k = e[g],
                    w = p()(e).filter(function (n) {
                        return !n.isComplete;
                    }),
                    A = w.length,
                    y = w.filter(function (n) {
                        return n.scheduled;
                    }),
                    F = w.filter(function (n) {
                        return !n.scheduled;
                    }),
                    I = function () {
                        return T(!1);
                    };
                Object(r.useEffect)(
                    function () {
                        I();
                    },
                    [e]
                );
                var _ = function (n) {
                        console.log('Setting theme:', n), f({ name: n });
                    },
                    M = {
                        onChangeTheme: _,
                        onSelectTask: v,
                        onUpdateTask: function () {
                            var n =
                                    arguments.length > 0 &&
                                    void 0 !== arguments[0]
                                        ? arguments[0]
                                        : Date.now(),
                                t =
                                    arguments.length > 1
                                        ? arguments[1]
                                        : void 0;
                            o(function (e) {
                                return Object(a.a)(
                                    Object(a.a)({}, e),
                                    {},
                                    {
                                        [n]: Object(a.a)(
                                            Object(a.a)({}, e[n]),
                                            t
                                        ),
                                    }
                                );
                            });
                        },
                        onUpdateTasks: function (n) {
                            o(function (t) {
                                return Object(a.a)(Object(a.a)({}, t), n);
                            });
                        },
                    };
                return i.a.createElement(
                    l.a,
                    { theme: d },
                    i.a.createElement(xn, null),
                    i.a.createElement(S, { appActions: M, isDragging: R }),
                    i.a.createElement(
                        Dn,
                        {
                            onDragOver: function () {
                                return T(!0);
                            },
                            onDragEnd: I,
                        },
                        i.a.createElement(mn, {
                            appActions: M,
                            selectedTaskId: g,
                            from: O,
                            style: {
                                opacity: A ? 1 : 0.25,
                                width: '30vw',
                                pointerEvents: A ? 'all' : 'none',
                            },
                            tasks: y,
                            to: E,
                        }),
                        i.a.createElement(V, {
                            appActions: M,
                            task: k,
                            style: {
                                width: '40vw',
                                height: '100vh',
                                opacity: A ? 1 : 0.25,
                                overflow: 'auto',
                            },
                        }),
                        i.a.createElement(
                            D,
                            { direction: 'column', style: { width: '30vw' } },
                            i.a.createElement(B, {
                                options: ['DARK', 'LIGHT'],
                                renderOption: function (n) {
                                    return n.toLowerCase();
                                },
                                renderSelectedOption: function (n) {
                                    return ''.concat(n, ' mode');
                                },
                                selectedOption: d.name,
                                onChange: _,
                            }),
                            i.a.createElement(On, {
                                appActions: M,
                                selectedTaskId: g,
                                tasks: F,
                            })
                        )
                    )
                );
            }
            var Tn = document.getElementById('root');
            u.a.render(i.a.createElement(Rn, null), Tn);
        },
    },
    [[29, 1, 2]],
]);
//# sourceMappingURL=main.3f4a9405.chunk.js.map
