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
                o = e(0),
                r = e.n(o),
                i = e(22),
                s = e.n(i),
                l = e(1),
                u = e(23),
                d = e.n(u),
                p = e(3),
                f = e(4),
                b = [15, 30, 45, 60, 90, 120],
                m = {},
                g = '7:00',
                h = '24:00',
                v = 'transition: all 0.15s ease-in-out',
                O = 'Add task notes',
                E = { PRIMARY: '#0094FF', BACKGROUND: '#000209' };
            (E.HIGH_CONTRAST_BACKGROUND = E.PRIMARY),
                (E.HIGH_CONTRAST_TEXT = E.BACKGROUND),
                (E.BORDER_HOVER = Object(f.c)(0.5, '#0094FF')),
                (E.BORDER_IDLE = Object(f.c)(0.3, '#0094FF')),
                (E.SHADED = Object(f.a)(0.1, E.BACKGROUND)),
                (E.TEXT = Object(f.c)(0.85, E.PRIMARY)),
                (E.TEXT_FADED = Object(f.c)(0.4, E.TEXT)),
                (E.BORDER_NEUTRAL = Object(f.c)(0.15, E.TEXT));
            var j = { PRIMARY: '#0094FF', BACKGROUND: 'white' };
            (j.HIGH_CONTRAST_BACKGROUND = j.PRIMARY),
                (j.HIGH_CONTRAST_TEXT = j.BACKGROUND),
                (j.BORDER_HOVER = Object(f.b)('#0094FF', 0.5)),
                (j.BORDER_IDLE = Object(f.b)('#0094FF', 0.3)),
                (j.BORDER_NEUTRAL = Object(f.c)(0.75, j.BACKGROUND)),
                (j.SHADED = Object(f.c)(0.95, j.PRIMARY)),
                (j.TEXT = Object(f.c)(0.15, j.PRIMARY)),
                (j.TEXT_FADED = j.BORDER_NEUTRAL);
            var x = { DARK: E, LIGHT: j },
                R = l.d.div(function (n) {
                    var t = n.border,
                        e = void 0 !== t && t,
                        a = n.isFlexible,
                        c = void 0 !== a && a,
                        o = n.margin,
                        r = void 0 === o ? 0 : o,
                        i = n.marginX,
                        s = void 0 === i ? 0 : i,
                        l = n.marginY,
                        u = void 0 === l ? 0 : l,
                        d = n.padding,
                        p = void 0 === d ? 0 : d,
                        f = n.paddingX,
                        b = void 0 === f ? 0 : f,
                        m = n.paddingY,
                        g = void 0 === m ? 0 : m,
                        h = n.theme;
                    return '\n        box-shadow: '
                        .concat(
                            e
                                ? '0 0 0 1px '.concat(x[h.name].BORDER_NEUTRAL)
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
                            u
                                ? '\n                    margin-top: calc('
                                      .concat(u, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    margin-bottom: calc('
                                      )
                                      .concat(u, ' * ')
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
                            g
                                ? '\n                    padding-top: calc('
                                      .concat(g, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    padding-bottom: calc('
                                      )
                                      .concat(g, ' * ')
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
                D = Object(l.d)(R)(function (n) {
                    var t = n.align,
                        e = void 0 === t ? 'center' : t,
                        a = n.direction,
                        c = void 0 === a ? 'row' : a,
                        o = n.isFlexible,
                        r = void 0 !== o && o,
                        i = n.justify,
                        s = void 0 === i ? 'stretch' : i,
                        l = n.spacing,
                        u = void 0 === l ? 0 : l;
                    return '\n        align-items: '
                        .concat(
                            e,
                            ';\n        display: flex;\n        flex-direction: '
                        )
                        .concat(c, ';\n        flex-grow: ')
                        .concat(r ? 1 : 0, ';\n        flex-shrink: ')
                        .concat(r ? 1 : 0, ';\n        justify-content: ')
                        .concat(
                            s,
                            ';\n        width: 100%;\n        \n        '
                        )
                        .concat(
                            u
                                ? '\n                    & > * + * {\n                        margin-'
                                      .concat(
                                          'row' === c ? 'left' : 'top',
                                          ': calc('
                                      )
                                      .concat(u, ' * ')
                                      .concat(
                                          '30px',
                                          ');\n                    }\n                '
                                      )
                                : '',
                            '\n    '
                        );
                }),
                T = Object(l.d)(D).attrs({
                    direction: 'column',
                    isFlexible: !0,
                })(function (n) {
                    n.theme;
                    return '\n        \n    ';
                }),
                w = Object(l.d)(D).attrs({ direction: 'column' })(function (n) {
                    n.theme;
                    return '\n        height: calc(100vh - '.concat(
                        '30px',
                        ');\n        overflow: auto;\n        position: relative;\n        \n        & > * {\n            align-self: stretch;\n        }\n    '
                    );
                }),
                k = Object(l.d)(D).attrs({ justify: 'center', paddingX: 0.5 })(
                    function (n) {
                        var t = n.theme;
                        return '\n        background: '
                            .concat(x[t.name].BACKGROUND, ';\n        color: ')
                            .concat(
                                x[t.name].TEXT_FADED,
                                ';\n        border-bottom: 2px solid '
                            )
                            .concat(
                                x[t.name].BORDER_NEUTRAL,
                                ';\n        font-size: 0.75rem;\n        height: '
                            )
                            .concat(
                                '30px',
                                ';\n        position: sticky;\n        text-transform: uppercase;\n        top: 0;\n        z-index: 100;\n    '
                            );
                    }
                ),
                A = function (n) {
                    var t = n.children,
                        e = n.label,
                        a = Object(p.a)(n, ['children', 'label']);
                    return r.a.createElement(
                        T,
                        null,
                        r.a.createElement(k, null, e),
                        r.a.createElement(w, a, t)
                    );
                },
                y = e(5),
                S = function (n, t) {
                    var e = Object(o.useState)(!1),
                        a = Object(c.a)(e, 2),
                        r = a[0],
                        i = a[1];
                    return [
                        {
                            isTargetedForDrop: r,
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
                },
                _ = function (n) {
                    return '\n    max(\n        (100vh - '
                        .concat('30px', ') / (')
                        .concat(8, ' * 60) * ')
                        .concat(n, ',\n        ')
                        .concat('30px', ' * 2 * ')
                        .concat(n, ' / 60\n    )\n');
                },
                I = Object(l.d)(D).attrs({
                    as: 'button',
                    justify: 'center',
                    paddingX: 0.5,
                    paddingY: 0.25,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background: '
                        .concat(x[t.name].PRIMARY, ';\n        border-radius: ')
                        .concat('3px', ';\n        color: ')
                        .concat(
                            x[t.name].TEXT,
                            ';\n        cursor: pointer;\n        transform: scale(1);\n        '
                        )
                        .concat(
                            v,
                            ';\n        \n        &:focus,\n        &:hover {\n            transform: scale(1.1);\n        }\n        &:active {\n            transform: scale(0.9);\n            filter: hue-rotate(20deg);\n        }\n    '
                        );
                }),
                F = Object(l.d)(I)(function (n) {
                    var t = n.theme;
                    return '\n        background: unset; \n        border-radius: '
                        .concat('3px', ';\n        border: 2px dashed ')
                        .concat(
                            x[t.name].BORDER_IDLE,
                            ';\n        width: 100%;\n        \n        &:focus,\n        &:hover {\n            border-color: '
                        )
                        .concat(x[t.name].BORDER_HOVER, ';\n        }\n    ');
                }),
                C = I,
                B = Object(l.d)(D).attrs({
                    justify: 'space-between',
                    paddingX: 1,
                    paddingY: 0.25,
                    spacing: 0.5,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '
                        .concat(x[t.name].BACKGROUND, ';\n        color: ')
                        .concat(
                            x[t.name].TEXT_FADED,
                            ';\n        width: 100%;\n        z-index: 10;\n        \n        &:hover {\n            color: '
                        )
                        .concat(x[t.name].TEXT, ';\n        }\n    ');
                }),
                M = Object(l.d)(C)(function (n) {
                    var t = n.isSelected;
                    n.theme;
                    return '\n        background: transparent;\n        color: inherit;\n        font-weight: '
                        .concat(t ? 900 : 100, ';\n        opacity: ')
                        .concat(t ? 1 : 0, ';\n        width: auto;\n        ')
                        .concat(v, ';\n        \n        ')
                        .concat(
                            B,
                            ':hover > & {\n            opacity: 1;\n        }\n    '
                        );
                }),
                N = function (n) {
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
                        i = n.selectedOption,
                        s = n.onChange,
                        l = Object(p.a)(n, [
                            'options',
                            'renderOption',
                            'renderSelectedOption',
                            'selectedOption',
                            'onChange',
                        ]);
                    return r.a.createElement(
                        B,
                        l,
                        t.map(function (n) {
                            var t = n === i;
                            return r.a.createElement(
                                M,
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
                U = Object(l.d)(D).attrs({ align: 'flex-start' })(function (n) {
                    var t = n.duration,
                        e = n.isActive,
                        a = n.isDragging,
                        c = n.isDraggingOver,
                        o = n.theme;
                    return '\n        background-color: '
                        .concat(
                            x[o.name].BACKGROUND,
                            ';\n        border-radius: '
                        )
                        .concat(
                            '3px',
                            ';\n        box-shadow: ',
                            '0 0 0 2px '.concat(
                                x[o.name][e ? 'PRIMARY' : 'BORDER_IDLE']
                            ),
                            ';\n        cursor: pointer;\n        height: '
                        )
                        .concat(_(t), ';\n        min-height: ')
                        .concat(_(20), ';\n        opacity: ')
                        .concat(a ? 0.5 : 1, ';\n        padding: 0 calc(')
                        .concat('30px', ' / 2) 0\n            calc(')
                        .concat('30px', ' / 2 + ')
                        .concat('5px', ');\n        pointer-events: ')
                        .concat(
                            c ? 'none' : 'auto',
                            ';\n        position: relative;\n        transition-property: opacity, top;\n        width: 100%;\n        z-index: '
                        )
                        .concat(e ? 10 : 'initial', ';\n        ')
                        .concat(
                            v,
                            ';\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            x[o.name].PRIMARY,
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
                            v,
                            ';\n        }\n        \n        &:hover {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            x[o.name].BORDER_HOVER,
                            ';\n        }\n        \n        &:focus {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            x[o.name].PRIMARY,
                            ';\n        }\n        \n        &:active {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(x[o.name].PRIMARY, ' inset;\n        }\n    ');
                }),
                X = Object(l.d)(D).attrs({ spacing: 0.5 })(function (n) {
                    var t = n.isActive,
                        e = n.theme;
                    return '\n        align-items: center;\n        color: '
                        .concat(
                            x[e.name][t ? 'TEXT' : 'TEXT_FADED'],
                            ';\n        display: flex;\n        justify-content: space-between;\n        height: 100%;\n        max-height: '
                        )
                        .concat(_(20), ';\n        ')
                        .concat(v, ';\n        \n        ')
                        .concat(U, ':hover > & {\n            color: ')
                        .concat(x[e.name].TEXT, ';\n        }\n    ');
                }),
                L = function (n) {
                    var t = n.appActions,
                        e = n.isActive,
                        a = n.task,
                        i = Object(p.a)(n, ['appActions', 'isActive', 'task']),
                        s = t.onSelectTask,
                        l = a.icon,
                        u = a.id,
                        d = a.label,
                        f = a.scheduled_minutes,
                        b = (function (n, t) {
                            var e = Object(o.useState)(!1),
                                a = Object(c.a)(e, 2),
                                r = a[0],
                                i = a[1],
                                s = Object(o.useState)(!1),
                                l = Object(c.a)(s, 2),
                                u = l[0],
                                d = l[1];
                            return [
                                {
                                    draggable: !0,
                                    isDragging: r,
                                    isDraggingOver: u,
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
                        })('task-id', u),
                        m = Object(c.a)(b, 1)[0];
                    return r.a.createElement(
                        U,
                        Object.assign(
                            {
                                duration: f,
                                isActive: e,
                                onClick: function () {
                                    return s(u);
                                },
                            },
                            m,
                            i
                        ),
                        r.a.createElement(
                            X,
                            { isActive: e },
                            r.a.createElement(
                                'div',
                                {
                                    style: {
                                        maxHeight: '100%',
                                        overflow: 'auto',
                                    },
                                },
                                d
                            ),
                            r.a.createElement('span', null, l)
                        )
                    );
                };
            function H() {
                var n = Object(y.a)([
                    '\n    position: absolute;\n    left: calc(100% + ',
                    ' * 2);\n    top: 50%;\n    transform: translateY(-50%);\n    white-space: nowrap;\n',
                ]);
                return (
                    (H = function () {
                        return n;
                    }),
                    n
                );
            }
            var Y = Object(l.d)(A).attrs({ label: 'Backlog' })(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        background-color: '
                        .concat(x[e.name].SHADED, ';\n        box-shadow: ')
                        .concat(
                            t
                                ? '0 0 0 5px '.concat(
                                      x[e.name].BORDER_HOVER,
                                      ' inset'
                                  )
                                : 'initial',
                            ';\n        flex-grow: 1;\n    '
                        );
                }),
                G = Object(l.d)(R)(H(), '30px'),
                K = function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = n.selectedTaskId,
                        o = n.tasks,
                        i =
                            (n.onClickTask,
                            Object(p.a)(n, [
                                'appActions',
                                'appData',
                                'selectedTaskId',
                                'tasks',
                                'onClickTask',
                            ])),
                        s = t.onChangeTheme,
                        l = t.onSelectTask,
                        u = t.onUpdateTask,
                        d = t.onUpdateTasks,
                        f = e.theme,
                        b = S('task-id', function (n) {
                            return u(n, { scheduled: !1 });
                        }),
                        m = Object(c.a)(b, 1)[0],
                        g = o.filter(function (n) {
                            return !n.scheduled;
                        });
                    return r.a.createElement(
                        Y,
                        Object.assign({}, m, i),
                        r.a.createElement(N, {
                            options: ['DARK', 'LIGHT'],
                            renderOption: function (n) {
                                return n.toLowerCase();
                            },
                            renderSelectedOption: function (n) {
                                return ''.concat(n, ' mode');
                            },
                            selectedOption: f,
                            onChange: s,
                        }),
                        r.a.createElement(
                            R,
                            { isFlexible: !0, style: { position: 'relative' } },
                            r.a.createElement(
                                D,
                                {
                                    justify: 'flex-start',
                                    direction: 'column',
                                    spacing: 1,
                                    padding: 1,
                                    style: {
                                        bottom: 0,
                                        left: 0,
                                        overflow: 'auto',
                                        position: 'absolute',
                                        right: 0,
                                        top: 0,
                                    },
                                },
                                r.a.createElement(
                                    'div',
                                    {
                                        style: {
                                            position: 'relative',
                                            width: '100%',
                                        },
                                    },
                                    0 === o.length &&
                                        r.a.createElement(
                                            G,
                                            null,
                                            r.a.createElement(
                                                'span',
                                                {
                                                    role: 'img',
                                                    'aria-label':
                                                        'left-pointing hand',
                                                },
                                                '\ud83d\udc48'
                                            ),
                                            ' ',
                                            'Create your first task'
                                        ),
                                    r.a.createElement(
                                        F,
                                        {
                                            style: { height: _(30) },
                                            onClick: function () {
                                                var n = Date.now(),
                                                    t = new Date(),
                                                    e = t.getHours(),
                                                    a = t.getMinutes();
                                                d({
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
                                                    l(n);
                                            },
                                        },
                                        'New Task'
                                    )
                                ),
                                g.map(function (n) {
                                    return r.a.createElement(L, {
                                        key: n.id,
                                        appActions: t,
                                        isActive: a === n.id,
                                        task: n,
                                    });
                                })
                            )
                        )
                    );
                };
            function P() {
                var n = Object(y.a)([
                    '\n        animation-direction: alternate;\n        animation-duration: 300ms;\n        animation-iteration-count: infinite;\n        animation-name: ',
                    ';\n        animation-timing-function: ease-in-out;\n        background: ',
                    ';\n        bottom: calc(',
                    ' * -1);\n        border-radius: calc(',
                    ' * 2);\n        height: calc(',
                    ' * 2);\n        pointer-events: ',
                    ';\n        position: fixed;\n        right: calc(',
                    ' * -1);\n        transform: scale(',
                    ');\n        width: calc(',
                    ' * 2);\n        z-index: 100;\n        ',
                    ";\n\n        &:before {\n            align-items: center;\n            content: '",
                    "';\n            display: flex;\n            font-size: 8rem;\n            justify-content: center;\n            height: calc(",
                    ' * 1.25);\n            left: 0;\n            position: absolute;\n            top: 0;\n            width: calc(',
                    ' * 1.25);\n        }\n    ',
                ]);
                return (
                    (P = function () {
                        return n;
                    }),
                    n
                );
            }
            function z() {
                var n = Object(y.a)([
                    '\n    0% {\n        box-shadow: 0 0 0 0 ',
                    ';\n        transform: scale(1);\n    }\n    100% {\n        box-shadow: 0 0 50px 0 ',
                    ';\n        transform: scale(1.2);\n    }\n',
                ]);
                return (
                    (z = function () {
                        return n;
                    }),
                    n
                );
            }
            var V = function (n) {
                    var t = n.theme;
                    return Object(l.e)(
                        z(),
                        x[t.name].PRIMARY,
                        x[t.name].PRIMARY
                    );
                },
                q = l.d.div(function (n) {
                    var t = n.isDragging,
                        e = n.isTargetedForDrop,
                        a = n.theme;
                    return Object(l.c)(
                        P(),
                        e ? V : 'unset',
                        Object(f.d)(e ? 0 : t ? 0.35 : 0.8, x[a.name].PRIMARY),
                        '20vw',
                        '20vw',
                        '20vw',
                        t ? 'all' : 'none',
                        '20vw',
                        t ? 0.5 : 0.25,
                        '20vw',
                        v,
                        '\ud83d\uddd1',
                        '20vw',
                        '20vw'
                    );
                }),
                J = function (n) {
                    var t = n.appActions,
                        e = n.isDragging,
                        a = Object(p.a)(n, ['appActions', 'isDragging']),
                        o = t.onSelectTask,
                        i = t.onUpdateTask,
                        s = S('task-id', function (n) {
                            i(n, { isComplete: !0 }),
                                o(function (t) {
                                    return t === n ? null : t;
                                });
                        }),
                        l = Object(c.a)(s, 1)[0];
                    return r.a.createElement(
                        q,
                        Object.assign({ isDragging: e }, l, a)
                    );
                },
                Q = e(26),
                W = e.n(Q),
                Z = Object(l.d)(R).attrs({ isFlexible: !0 })(function (n) {
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
                            ';\n        width: auto;\n        height: auto;\n    \n        // Tracing element\n        &:before {\n            border: 2px dashed '
                        )
                        .concat(
                            x[a.name].BORDER_HOVER,
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
                            v,
                            ';\n        }\n        \n        &:hover {\n            &:before {\n                opacity: 1;\n            }\n        }\n    '
                        );
                }),
                $ = function (n) {
                    var t = n.isMultiLine,
                        e = void 0 !== t && t,
                        a = n.placeholder,
                        i = void 0 === a ? 'Empty' : a,
                        s = n.render,
                        l =
                            void 0 === s
                                ? function (n) {
                                      return n;
                                  }
                                : s,
                        u = n.value,
                        d = void 0 === u ? '' : u,
                        f = n.wrapperStyles,
                        b = void 0 === f ? {} : f,
                        m = n.onSave,
                        g = void 0 === m ? function () {} : m,
                        h = Object(p.a)(n, [
                            'isMultiLine',
                            'placeholder',
                            'render',
                            'value',
                            'wrapperStyles',
                            'onSave',
                        ]),
                        v = Object(o.useState)(!1),
                        O = Object(c.a)(v, 2),
                        E = O[0],
                        j = O[1],
                        x = Object(o.useState)(d),
                        D = Object(c.a)(x, 2),
                        T = D[0],
                        w = D[1],
                        k = Object(o.useState)(null),
                        A = Object(c.a)(k, 2),
                        y = A[0],
                        S = A[1],
                        _ = Object(o.useRef)(null),
                        I = Object(o.useRef)(null),
                        F = '' === d.trim();
                    Object(o.useEffect)(
                        function () {
                            w(d);
                        },
                        [d]
                    ),
                        Object(o.useEffect)(
                            function () {
                                E &&
                                    _.current &&
                                    (_.current.select(), _.current.focus());
                            },
                            [_, E]
                        ),
                        Object(o.useEffect)(
                            function () {
                                var n = I.current;
                                n && S(n.offsetHeight);
                            },
                            [T, E, I]
                        );
                    return r.a.createElement(
                        Z,
                        Object.assign(
                            {
                                isEditing: E,
                                isEmpty: F,
                                onClick: function () {
                                    w(d), j(!0);
                                },
                            },
                            h
                        ),
                        r.a.createElement(
                            R,
                            { style: b },
                            E
                                ? r.a.createElement(
                                      r.a.Fragment,
                                      null,
                                      r.a.createElement(
                                          'div',
                                          {
                                              ref: I,
                                              style: {
                                                  position: 'absolute',
                                                  pointerEvents: 'none',
                                                  opacity: 0,
                                                  outline: '2px dotted red',
                                                  whiteSpace: 'pre-wrap',
                                                  width: '100%',
                                              },
                                          },
                                          T,
                                          '.'
                                      ),
                                      r.a.createElement('textarea', {
                                          disabled: !E,
                                          ref: _,
                                          rows: 1,
                                          style: {
                                              display: 'block',
                                              height: ''.concat(y, 'px'),
                                              width: '100%',
                                          },
                                          value: T,
                                          onBlur: function () {
                                              g(T), j(!1);
                                          },
                                          onChange: function (n) {
                                              w(n.target.value);
                                          },
                                          onKeyDown: function (n) {
                                              return 'Escape' === n.key
                                                  ? (w(d), void j(!1))
                                                  : 'Enter' !== n.key ||
                                                    ((n.metaKey ||
                                                        n.shiftKey ||
                                                        !e) &&
                                                        (g(T), j(!1)),
                                                    e)
                                                  ? void 0
                                                  : (n.preventDefault(), !1);
                                          },
                                      })
                                  )
                                : l(F ? i : d)
                        )
                    );
                };
            function nn() {
                var n = Object(y.a)([
                    '\n    flex-shrink: 0;\n    font-size: 3rem;\n    line-height: 1.4rem;\n    width: 3rem;\n',
                ]);
                return (
                    (nn = function () {
                        return n;
                    }),
                    n
                );
            }
            function tn() {
                var n = Object(y.a)([
                    '\n    flex-grow: 1;\n    justify-self: stretch;\n',
                ]);
                return (
                    (tn = function () {
                        return n;
                    }),
                    n
                );
            }
            var en = Object(l.d)(A)(function (n) {
                    var t = n.isLoading,
                        e = n.theme;
                    return '\n        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1);\n        border-left: 2px solid '
                        .concat(
                            x[e.name].BORDER_NEUTRAL,
                            ';\n        border-right: 2px solid '
                        )
                        .concat(
                            x[e.name].BORDER_NEUTRAL,
                            ';\n        overflow: unset;\n        z-index: 1;\n        \n        // Blackout curtain\n        &:before {\n            background-color: '
                        )
                        .concat(
                            x[e.name].BACKGROUND,
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
                an = Object(l.d)(D).attrs({
                    as: 'h1',
                    align: 'flex-start',
                    spacing: 1.5,
                    paddingX: 1,
                    paddingY: 0.75,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '.concat(
                        x[t.name].SHADED,
                        ';\n        font-size: 1.4rem;\n        font-weight: 900;\n        position: relative;\n    '
                    );
                }),
                cn = Object(l.d)(R).attrs({ role: 'image' })(tn()),
                on = Object(l.d)(R).attrs({ role: 'img' })(nn()),
                rn = function (n) {
                    var t = n.appActions,
                        e = n.task,
                        a = void 0 === e ? {} : e,
                        i = Object(p.a)(n, ['appActions', 'task']),
                        s = Object(o.useState)(!1),
                        l = Object(c.a)(s, 2),
                        u = l[0],
                        d = l[1],
                        f = t.onUpdateTask,
                        m = a.icon,
                        g = a.id,
                        h = a.label,
                        v = a.notes,
                        E = a.scheduled_minutes,
                        j = !a.id,
                        x = function (n, t) {
                            return f(g, { [n]: t });
                        };
                    return (
                        Object(o.useLayoutEffect)(
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
                        r.a.createElement(
                            en,
                            Object.assign(
                                {
                                    isLoading: u,
                                    label: 'Selected Task Details',
                                },
                                i
                            ),
                            !j &&
                                !u &&
                                r.a.createElement(
                                    r.a.Fragment,
                                    null,
                                    r.a.createElement(N, {
                                        renderSelectedOption: function (n) {
                                            return ''.concat(n, ' mins');
                                        },
                                        selectedOption: E,
                                        options: b,
                                        onChange: function (n) {
                                            return x('scheduled_minutes', n);
                                        },
                                    }),
                                    r.a.createElement(
                                        an,
                                        null,
                                        r.a.createElement(
                                            cn,
                                            null,
                                            r.a.createElement($, {
                                                placeholder: 'Untitled',
                                                value: h,
                                                onSave: function (n) {
                                                    return x('label', n);
                                                },
                                            })
                                        ),
                                        r.a.createElement(
                                            on,
                                            null,
                                            r.a.createElement($, {
                                                placeholder: '\ud83d\udccc',
                                                value: m,
                                                onSave: function (n) {
                                                    return x('icon', n);
                                                },
                                            })
                                        )
                                    ),
                                    r.a.createElement($, {
                                        isFlexible: !0,
                                        isMultiLine: !0,
                                        margin: 1,
                                        placeholder: O,
                                        render: function (n) {
                                            return r.a.createElement('div', {
                                                className: 'markdown',
                                                dangerouslySetInnerHTML: {
                                                    __html: W()(n),
                                                },
                                            });
                                        },
                                        wrapperStyles: {
                                            bottom: 0,
                                            left: 0,
                                            overflow: 'auto',
                                            position: 'absolute',
                                            right: 0,
                                            top: 0,
                                        },
                                        value: v,
                                        onSave: function (n) {
                                            return x('notes', n);
                                        },
                                    })
                                )
                        )
                    );
                },
                sn = e(9),
                ln = e.n(sn),
                un = function (n) {
                    return n
                        ? n.split(':').map(function (n) {
                              return parseInt(n, 10);
                          })
                        : [0, 0];
                };
            function dn() {
                var n = Object(y.a)([
                    '\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n',
                ]);
                return (
                    (dn = function () {
                        return n;
                    }),
                    n
                );
            }
            var pn = l.d.div(dn()),
                fn = l.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        position: relative;\n        width: 100%;\n        height: '
                        .concat(
                            _(15),
                            ';\n        z-index: 1;\n        border-top: '
                        )
                        .concat(
                            t ? '4px dotted '.concat(x[e.name].PRIMARY) : '',
                            ';\n    '
                        );
                }),
                bn = function (n) {
                    var t,
                        e = n.appActions,
                        a = n.quarterInMinutes,
                        o = Object(p.a)(n, ['appActions', 'quarterInMinutes']),
                        i = e.onUpdateTask,
                        s = un(g),
                        l = Object(c.a)(s, 2),
                        u = l[0],
                        d = l[1],
                        f =
                            ((t = 60 * u + d + 15 * a),
                            ''.concat(Math.floor(t / 60), ':').concat(t % 60)),
                        b = S('task-id', function (n) {
                            return i(n, { scheduled: !0, scheduled_time: f });
                        }),
                        m = Object(c.a)(b, 1)[0];
                    return r.a.createElement(fn, Object.assign({}, m, o));
                },
                mn = function (n) {
                    var t = n.appActions,
                        e = n.totalMinutes,
                        a = Object(p.a)(n, ['appActions', 'totalMinutes']);
                    return r.a.createElement(
                        pn,
                        a,
                        ln()(e / 15).map(function (n) {
                            return r.a.createElement(bn, {
                                key: n,
                                appActions: t,
                                quarterInMinutes: n,
                            });
                        })
                    );
                };
            function gn() {
                var n = Object(y.a)([
                    '\n    position: relative;\n    height: ',
                    ';\n',
                ]);
                return (
                    (gn = function () {
                        return n;
                    }),
                    n
                );
            }
            function hn() {
                var n = Object(y.a)([
                    '\n    position: absolute;\n    top: 0;\n    right: 0;\n    bottom: 0;\n    left: 0;\n    overflow: auto;\n    user-select: none;\n',
                ]);
                return (
                    (hn = function () {
                        return n;
                    }),
                    n
                );
            }
            function vn() {
                var n = Object(y.a)(['']);
                return (
                    (vn = function () {
                        return n;
                    }),
                    n
                );
            }
            var On = Object(l.d)(A).attrs({ label: "Today's Plan" })(vn()),
                En = l.d.div(hn()),
                jn = l.d.div(gn(), _(30)),
                xn = l.d.div(function (n) {
                    var t = n.hideLabel,
                        e = n.isFaded,
                        a = n.theme;
                    return '\n        color: '
                        .concat(
                            t
                                ? 'transparent'
                                : Object(f.d)(e ? 1 : 0, x[a.name].TEXT_FADED),
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
                                x[a.name].BORDER_NEUTRAL
                            ),
                            ";\n            content: '';\n            height: 1px;\n            left: "
                        )
                        .concat(
                            '80px',
                            ';\n            position: absolute;\n            right: 0;\n            top: 50%;\n        }\n    '
                        );
                }),
                Rn = Object(l.d)(L)(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        position: absolute;\n        left: calc('
                        .concat('30px', ' * 3);\n        right: ')
                        .concat('30px', ';\n        top: ')
                        .concat(
                            _(t),
                            ';\n        width: auto;\n        z-index: 2;\n    '
                        );
                }),
                Dn = l.d.div(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        background-color: red;\n        height: 1px;\n        left: 0;\n        pointer-events: none;\n        position: absolute;\n        right: 0;\n        top: '.concat(
                        _(t),
                        ';\n        z-index: 10;\n    '
                    );
                }),
                Tn = function (n) {
                    var t = n.appActions,
                        e = n.selectedTaskId,
                        a = n.from,
                        i = n.tasks,
                        s = n.to,
                        l =
                            (n.onClickTask,
                            Object(p.a)(n, [
                                'appActions',
                                'selectedTaskId',
                                'from',
                                'tasks',
                                'to',
                                'onClickTask',
                            ])),
                        u = Object(o.useState)(null),
                        d = Object(c.a)(u, 2),
                        f = d[0],
                        b = d[1],
                        m = un(f),
                        g = Object(c.a)(m, 2),
                        h = g[0],
                        v = g[1],
                        O = un(a),
                        E = Object(c.a)(O, 2),
                        j = E[0],
                        x = E[1],
                        R = Object(o.useState)(!1),
                        D = Object(c.a)(R, 2),
                        T = D[0],
                        w = D[1],
                        k = i.filter(function (n) {
                            return n.scheduled;
                        }),
                        A = un(s),
                        y = Object(c.a)(A, 2),
                        S = y[0],
                        _ = y[1],
                        I = S - j,
                        F = 60 * S + _ - (60 * j + x),
                        C = Object(o.useRef)(null),
                        B = Object(o.useRef)(null);
                    return (
                        Object(o.useEffect)(function () {
                            var n = function () {
                                var n = new Date();
                                b(
                                    ''
                                        .concat(n.getHours(), ':')
                                        .concat(n.getMinutes())
                                ),
                                    w(!0);
                            };
                            n();
                            var t = setInterval(n, 500);
                            return function () {
                                return clearInterval(t);
                            };
                        }, []),
                        Object(o.useEffect)(
                            function () {
                                T &&
                                    C.current &&
                                    B.current &&
                                    B.current.scrollTo(
                                        0,
                                        C.current.offsetTop - 150
                                    );
                            },
                            [T, C, B]
                        ),
                        r.a.createElement(
                            On,
                            l,
                            r.a.createElement(
                                En,
                                { ref: B },
                                k.map(function (n) {
                                    var a = un(n.scheduled_time),
                                        o = Object(c.a)(a, 2),
                                        i = 60 * o[0] + o[1] - (60 * j + x);
                                    return r.a.createElement(Rn, {
                                        key: n.id,
                                        appActions: t,
                                        isActive: e === n.id,
                                        offsetMinutes: i,
                                        task: n,
                                    });
                                }),
                                r.a.createElement(Dn, {
                                    ref: C,
                                    offsetMinutes: 60 * h + v - (60 * j + x),
                                }),
                                r.a.createElement(mn, {
                                    appActions: t,
                                    totalMinutes: F,
                                }),
                                ln()(I).map(function (n) {
                                    return r.a.createElement(
                                        o.Fragment,
                                        { key: n },
                                        r.a.createElement(
                                            jn,
                                            null,
                                            r.a.createElement(
                                                xn,
                                                { hideLabel: 0 === n },
                                                (j + n) % 12 || 12,
                                                ':00'
                                            )
                                        ),
                                        r.a.createElement(
                                            jn,
                                            null,
                                            r.a.createElement(
                                                xn,
                                                { isFaded: !0 },
                                                (j + n) % 12 || 12,
                                                ':30'
                                            )
                                        )
                                    );
                                })
                            )
                        )
                    );
                },
                wn = Object(l.b)(function (n) {
                    var t = n.theme;
                    return '\n        * {\n            background: unset;\n            border: unset;\n            box-sizing: border-box;\n            color: unset;\n            font: unset;\n            line-height: 1.4em;\n            list-style-type: none;\n            margin: 0;\n            outline: unset;\n            padding: 0;\n        }\n        :root {\n            background: '
                        .concat(x[t.name].BACKGROUND, ';\n            color: ')
                        .concat(
                            x[t.name].TEXT,
                            ";\n            font-family: 'Operator Mono', monospace;\n            font-weight: 300;\n            height: 100%;\n            overflow: hidden;\n        }\n        strong {\n            font-weight: 900;\n        }\n        em {\n            font-style: italic;\n        }\n        \n        .markdown {\n            * + * {\n                margin-top: calc("
                        )
                        .concat(
                            '30px',
                            ' * 0.5);\n            }\n            \n            h1 {\n                color: '
                        )
                        .concat(
                            x[t.name].TEXT_FADED,
                            ';\n                font-size: 1.4rem;\n                font-weight: 500;\n                border-bottom: 2px dotted '
                        )
                        .concat(
                            x[t.name].TEXT_FADED,
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
                            x[t.name].TEXT_FADED,
                            ';\n                font-style: italic;\n                padding: calc('
                        )
                        .concat('30px', ' * 0.5) ')
                        .concat(
                            '30px',
                            ';\n            }\n        \n            li {\n                padding-left: '
                        )
                        .concat(
                            '30px',
                            ";\n                position: relative;\n        \n                &:before {\n                    content: '';\n                    box-sizing: border-box;\n                    position: absolute;\n                    top: 5px;\n                    left: 0;\n                    border: 2px dotted "
                        )
                        .concat(
                            x[t.name].TEXT_FADED,
                            ';\n                    border-radius: 100px;\n                    width: '
                        )
                        .concat('10px', ';\n                    height: ')
                        .concat(
                            '10px',
                            ';\n                }\n            }\n        }\n    '
                        );
                }),
                kn = function (n, t) {
                    var e = Object(o.useState)(!1),
                        a = Object(c.a)(e, 2),
                        r = a[0],
                        i = a[1],
                        s = Object(o.useState)(t),
                        l = Object(c.a)(s, 2),
                        u = l[0],
                        d = l[1];
                    return (
                        Object(o.useEffect)(
                            function () {
                                if (!r) {
                                    var e = window.localStorage.getItem(n);
                                    d(JSON.parse(e) || t), i(!0);
                                }
                            },
                            [n, t, r]
                        ),
                        Object(o.useEffect)(
                            function () {
                                r &&
                                    window.localStorage.setItem(
                                        n,
                                        JSON.stringify(u)
                                    );
                            },
                            [r, n, u]
                        ),
                        [u, d]
                    );
                };
            function An() {
                var n = kn('tasks', m),
                    t = Object(c.a)(n, 2),
                    e = t[0],
                    i = t[1],
                    s = kn('theme-name', 'DARK'),
                    u = Object(c.a)(s, 2),
                    p = u[0],
                    f = u[1],
                    b = kn('selected-task-id', null),
                    v = Object(c.a)(b, 2),
                    O = v[0],
                    E = v[1],
                    j = Object(o.useState)(!1),
                    x = Object(c.a)(j, 2),
                    R = x[0],
                    T = x[1],
                    w = e[O],
                    k = d()(e).filter(function (n) {
                        return !n.isComplete;
                    }),
                    A = k.length,
                    y = function () {
                        return T(!1);
                    };
                Object(o.useEffect)(
                    function () {
                        y();
                    },
                    [e]
                );
                var S = {
                        onChangeTheme: f,
                        onSelectTask: E,
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
                            i(function (e) {
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
                            i(function (t) {
                                return Object(a.a)(Object(a.a)({}, t), n);
                            });
                        },
                    },
                    _ = { selectedTaskId: O, tasks: e, theme: p };
                return r.a.createElement(
                    l.a,
                    { theme: { name: p } },
                    r.a.createElement(wn, null),
                    r.a.createElement(J, { appActions: S, isDragging: R }),
                    r.a.createElement(
                        D,
                        {
                            align: 'stretch',
                            direction: 'row-reverse',
                            onDragOver: function () {
                                return T(!0);
                            },
                            onDragEnd: y,
                        },
                        r.a.createElement(Tn, {
                            appActions: S,
                            selectedTaskId: O,
                            from: g,
                            style: {
                                opacity: A ? 1 : 0.25,
                                width: '30vw',
                                pointerEvents: A ? 'all' : 'none',
                            },
                            tasks: k,
                            to: h,
                        }),
                        r.a.createElement(rn, {
                            appActions: S,
                            task: w,
                            style: { width: '40vw', opacity: A ? 1 : 0.25 },
                        }),
                        r.a.createElement(K, {
                            appActions: S,
                            appData: _,
                            selectedTaskId: O,
                            style: { width: '30vw' },
                            tasks: k,
                        })
                    )
                );
            }
            var yn = document.getElementById('root');
            s.a.render(r.a.createElement(An, null), yn);
        },
    },
    [[29, 1, 2]],
]);
//# sourceMappingURL=main.21b5fab4.chunk.js.map
