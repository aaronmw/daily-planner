(window.webpackJsonp = window.webpackJsonp || []).push([
    [0],
    {
        171: function (n, t, e) {
            'use strict';
            e.r(t);
            var a = e(21),
                c = e(2),
                o = e(0),
                i = e.n(o),
                r = e(54),
                s = e.n(r),
                l = e(1),
                u = e(29),
                d = e.n(u),
                f = e(3),
                p = e(5),
                b = function (n) {
                    var t =
                            arguments.length > 1 && void 0 !== arguments[1]
                                ? arguments[1]
                                : function () {},
                        e = Object(o.useState)(!1),
                        a = Object(c.a)(e, 2),
                        i = a[0],
                        r = a[1],
                        s = Object(o.useRef)(null);
                    return [
                        {
                            isTargetedForDrop: i,
                            droppable: !0,
                            onDragEnter: function (n) {
                                n.preventDefault(),
                                    (s.current = n.target),
                                    i || r(!0);
                            },
                            onDragOver: function (n) {
                                n.preventDefault();
                            },
                            onDragLeave: function (n) {
                                n.target === s.current && r(!1);
                            },
                            onDrop: function (e) {
                                var a = e.dataTransfer.getData(n);
                                a && t(isNaN(a) ? a : parseFloat(a), e), r(!1);
                            },
                        },
                    ];
                },
                m = e(4),
                g = '\ud83d\udccc',
                h = [15, 30, 45, 60, 90, 120],
                v = '30px',
                O = [{ id: 1, label: 'Default List' }],
                E = [],
                k = v,
                j = '7:00',
                D = '24:00',
                T = 'transition: all 0.15s ease-in-out',
                R = {
                    motivational_descriptors: [
                        'Adorable',
                        'Adventurous',
                        'Amazing',
                        'Ambitious',
                        'Awesome',
                        'Beautiful',
                        'Bold',
                        'Bright',
                        'Charming',
                        'Clean',
                        'Colourful',
                        'Cute',
                        'Dashing',
                        'Elegant',
                        'Excellent',
                        'Exciting',
                        'Fabulous',
                        'Fantastic',
                        'Fresh',
                        'Gorgeous',
                        'Happy',
                        'Important',
                        'Incredible',
                        'Neat',
                        'Outstanding',
                        'Scrappy',
                        'Sleek',
                        'Special',
                        'Splendid',
                        'Super',
                        'Thoughtful',
                        'Wonderful',
                    ],
                    backlog_hide: 'Hide Backlog',
                    backlog_show: 'Show Backlog',
                    empty_label: '...label?',
                    empty_notes: '...notes?',
                    new_task_label: 'New Task',
                    new_task_notes: '',
                    toggle_dark_mode: 'Switch to Dark Mode (\u2318D)',
                    toggle_light_mode: 'Turn off Dark Mode (\u2318D)',
                },
                w = { PRIMARY: '#0094FF', BACKGROUND: '#000209' };
            (w.HIGH_CONTRAST_BACKGROUND = w.PRIMARY),
                (w.HIGH_CONTRAST_TEXT = w.BACKGROUND),
                (w.BORDER_HOVER = Object(m.c)(0.5, '#0094FF')),
                (w.BORDER_IDLE = Object(m.c)(0.3, '#0094FF')),
                (w.SHADED = Object(m.a)(0.1, w.BACKGROUND)),
                (w.TEXT = Object(m.c)(0.85, w.PRIMARY)),
                (w.TEXT_FADED = Object(m.c)(0.4, w.TEXT)),
                (w.BORDER_NEUTRAL = Object(m.c)(0.15, w.TEXT));
            var A = { PRIMARY: '#0094FF', BACKGROUND: 'white' };
            (A.HIGH_CONTRAST_BACKGROUND = A.PRIMARY),
                (A.HIGH_CONTRAST_TEXT = A.BACKGROUND),
                (A.BORDER_HOVER = Object(m.b)('#0094FF', 0.5)),
                (A.BORDER_IDLE = Object(m.b)('#0094FF', 0.3)),
                (A.BORDER_NEUTRAL = Object(m.c)(0.75, A.BACKGROUND)),
                (A.SHADED = Object(m.c)(0.95, A.PRIMARY)),
                (A.TEXT = Object(m.c)(0.15, A.PRIMARY)),
                (A.TEXT_FADED = A.BORDER_NEUTRAL);
            var x = { DARK: w, LIGHT: A },
                y = function (n) {
                    return '\n    max(\n        (100vh - '
                        .concat(v, ') / (')
                        .concat(8, ' * 60) * ')
                        .concat(n, ',\n        ')
                        .concat(k, ' * 2 * ')
                        .concat(n, ' / 60\n    )\n');
                },
                _ = function (n) {
                    return parseInt(n, 10);
                },
                C = l.d.div(function (n) {
                    var t = n.border,
                        e = void 0 !== t && t,
                        a = n.isFlexible,
                        c = void 0 !== a && a,
                        o = n.margin,
                        i = void 0 === o ? 0 : o,
                        r = n.marginX,
                        s = void 0 === r ? 0 : r,
                        l = n.marginY,
                        u = void 0 === l ? 0 : l,
                        d = n.padding,
                        f = void 0 === d ? 0 : d,
                        p = n.paddingX,
                        b = void 0 === p ? 0 : p,
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
                                          v,
                                          ');\n                    margin-right: calc('
                                      )
                                      .concat(s, ' * ')
                                      .concat(v, ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            u
                                ? '\n                    margin-top: calc('
                                      .concat(u, ' * ')
                                      .concat(
                                          v,
                                          ');\n                    margin-bottom: calc('
                                      )
                                      .concat(u, ' * ')
                                      .concat(v, ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            i
                                ? '\n                    margin: calc('
                                      .concat(i, ' * ')
                                      .concat(v, ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            b
                                ? '\n                    padding-left: calc('
                                      .concat(b, ' * ')
                                      .concat(
                                          v,
                                          ');\n                    padding-right: calc('
                                      )
                                      .concat(b, ' * ')
                                      .concat(v, ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            g
                                ? '\n                    padding-top: calc('
                                      .concat(g, ' * ')
                                      .concat(
                                          v,
                                          ');\n                    padding-bottom: calc('
                                      )
                                      .concat(g, ' * ')
                                      .concat(v, ');\n                ')
                                : '',
                            '\n        '
                        )
                        .concat(
                            f
                                ? '\n                    padding: calc('
                                      .concat(f, ' * ')
                                      .concat(v, ');\n                ')
                                : '',
                            '\n    '
                        );
                }),
                B = Object(l.d)(C)(function (n) {
                    var t = n.align,
                        e = void 0 === t ? 'center' : t,
                        a = n.direction,
                        c = void 0 === a ? 'row' : a,
                        o = n.isFlexible,
                        i = void 0 !== o && o,
                        r = n.justify,
                        s = void 0 === r ? 'stretch' : r,
                        l = n.spacing,
                        u = void 0 === l ? 0 : l;
                    return '\n        align-items: '
                        .concat(
                            e,
                            ';\n        display: flex;\n        flex-direction: '
                        )
                        .concat(c, ';\n        flex-grow: ')
                        .concat(i ? 1 : 0, ';\n        flex-shrink: ')
                        .concat(i ? 1 : 0, ';\n        justify-content: ')
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
                                          v,
                                          ');\n                    }\n                '
                                      )
                                : '',
                            '\n    '
                        );
                }),
                I = Object(l.d)(B).attrs({
                    direction: 'column',
                    isFlexible: !0,
                })(function (n) {
                    n.theme;
                    return '\n    ';
                }),
                S = Object(l.d)(B).attrs({ direction: 'column' })(function (n) {
                    n.theme;
                    return '\n        height: calc(100vh - '
                        .concat(
                            v,
                            ');\n        overflow: auto;\n        position: relative;\n        '
                        )
                        .concat(
                            T,
                            ';\n        \n        & > * {\n            align-self: stretch;\n        }\n    '
                        );
                }),
                F = Object(l.d)(B).attrs({ justify: 'center' })(function (n) {
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
                            v,
                            ';\n        position: sticky;\n        text-transform: uppercase;\n        top: 0;\n        z-index: 100;\n    '
                        );
                }),
                M = function (n) {
                    var t = n.children,
                        e = n.label,
                        a = Object(f.a)(n, ['children', 'label']);
                    return i.a.createElement(
                        I,
                        null,
                        i.a.createElement(F, null, e),
                        i.a.createElement(S, a, t)
                    );
                },
                L = Object(l.d)(B).attrs({
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
                            T,
                            ';\n        \n        &:focus,\n        &:hover {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            x[t.name].PRIMARY,
                            ';\n        }\n        &:active {\n            transform: scale(0.9);\n            filter: hue-rotate(20deg);\n        }\n    '
                        );
                }),
                N = Object(l.d)(L)(function (n) {
                    var t = n.theme;
                    return '\n        background: unset; \n        border: 2px dashed '
                        .concat(
                            x[t.name].BORDER_IDLE,
                            ';\n        width: 100%;\n        \n        &:focus,\n        &:hover {\n            border-color: '
                        )
                        .concat(x[t.name].BORDER_HOVER, ';\n        }\n    ');
                }),
                H = Object(l.d)(L)(function (n) {
                    n.isActive, n.theme;
                    return '\n        background: unset;\n        width: auto;\n    ';
                }),
                X = L,
                U = Object(l.d)(B).attrs({
                    align: 'center',
                    justify: 'space-between',
                    paddingX: 0.5,
                    spacing: 0.5,
                })(function (n) {
                    var t = n.theme;
                    return '\n        background-color: '
                        .concat(x[t.name].BACKGROUND, ';\n        color: ')
                        .concat(
                            x[t.name].TEXT_FADED,
                            ';\n        height: calc('
                        )
                        .concat(
                            v,
                            ' * 1.5);\n        width: 100%;\n        z-index: 10;\n        \n        &:focus-within,\n        &:hover {\n            color: '
                        )
                        .concat(x[t.name].TEXT, ';\n        }\n    ');
                }),
                G = Object(l.d)(X)(function (n) {
                    var t = n.isSelected;
                    return '\n        background: transparent;\n        color: inherit;\n        font-weight: '
                        .concat(t ? 900 : 100, ';\n        opacity: ')
                        .concat(t ? 1 : 0, ';\n        width: auto;\n        ')
                        .concat(T, ';\n        \n        ')
                        .concat(U, ':focus-within > &,\n        ')
                        .concat(
                            U,
                            ':hover > & {\n            opacity: 1;\n        }\n    '
                        );
                }),
                Y = function (n) {
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
                        l = Object(f.a)(n, [
                            'options',
                            'renderOption',
                            'renderSelectedOption',
                            'selectedOption',
                            'onChange',
                        ]);
                    return i.a.createElement(
                        U,
                        l,
                        t.map(function (n) {
                            var t = n === r;
                            return i.a.createElement(
                                G,
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
                K = Object(l.d)(B).attrs({
                    align: 'flex-start',
                    justify: 'space-between',
                    spacing: 0.5,
                    paddingX: 0.5,
                })(function (n) {
                    var t = n.duration,
                        e = n.isActive,
                        a = n.isDragging,
                        c = n.theme;
                    return '\n        background-color: '
                        .concat(
                            x[c.name].BACKGROUND,
                            ';\n        border-radius: '
                        )
                        .concat('3px', ';\n        box-shadow: 0 0 0 2px ')
                        .concat(
                            x[c.name][e ? 'PRIMARY' : 'BORDER_IDLE'],
                            ';\n        cursor: pointer;\n        height: '
                        )
                        .concat(y(t), ';\n        opacity: ')
                        .concat(
                            a ? 0 : 1,
                            ';\n        overflow: hidden;\n        padding-left: calc('
                        )
                        .concat(v, ' * 0.5 + ')
                        .concat(
                            '5px',
                            ');\n        position: relative;\n        transition-property: opacity, top;\n        width: 100%;\n        z-index: '
                        )
                        .concat(e ? 10 : 'initial', ';\n        ')
                        .concat(
                            T,
                            ';\n        transition-property:\n            background-color,\n            box-shadow,\n            height,\n            min-height,\n            opacity,\n            width;\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            x[c.name].PRIMARY,
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
                            T,
                            ';\n        }\n        \n        &:hover {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            x[c.name].BORDER_HOVER,
                            ';\n        }\n        \n        &:focus {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            x[c.name].PRIMARY,
                            ';\n        }\n        \n        &:active {\n            box-shadow: 0 0 0 2px '
                        )
                        .concat(
                            x[c.name].PRIMARY,
                            ' inset;\n        }\n        \n        '
                        )
                        .concat(P, ' {\n            color: ')
                        .concat(
                            x[c.name][e ? 'TEXT' : 'TEXT_FADED'],
                            ';\n            min-height: '
                        )
                        .concat(y(Math.min(30, t)), ';\n        }\n\n        ')
                        .concat(z, ' {\n            height: ')
                        .concat(y(Math.min(30, t)), ';\n        }\n    ');
                }),
                P = Object(l.d)(B).attrs({ align: 'center', isFlexible: !0 })(
                    function (n) {
                        var t = n.theme;
                        return '\n        position: relative;\n        width: auto;\n        '
                            .concat(T, ';\n        \n        ')
                            .concat(K, ':hover > & {\n            color: ')
                            .concat(x[t.name].TEXT, ';\n        }\n    ');
                    }
                ),
                z = Object(l.d)(B).attrs({
                    align: 'center',
                    justify: 'center',
                })(function (n) {
                    n.theme;
                    return '\n        width: auto;\n    ';
                }),
                V = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.isActive,
                        a = n.task,
                        r = Object(f.a)(n, ['appActions', 'isActive', 'task']),
                        s = t.onSelectTask,
                        l = a.icon,
                        u = a.id,
                        d = a.label,
                        p = a.scheduled_minutes,
                        b = (function (n, t) {
                            var e = Object(o.useState)(!1),
                                a = Object(c.a)(e, 2),
                                i = a[0],
                                r = a[1];
                            return [
                                {
                                    draggable: !0,
                                    isDragging: i,
                                    onDragEnd: function () {
                                        r(!1);
                                    },
                                    onDragStart: function (e) {
                                        e.dataTransfer.setData(n, t), r(!0);
                                    },
                                },
                            ];
                        })('task-id', u),
                        m = Object(c.a)(b, 1)[0];
                    return i.a.createElement(
                        K,
                        Object.assign(
                            {
                                'data-task-id': u,
                                duration: p,
                                isActive: e,
                                tabIndex: 0,
                                onClick: function () {
                                    return s(u);
                                },
                            },
                            m,
                            r
                        ),
                        i.a.createElement(P, null, d),
                        i.a.createElement(z, null, l)
                    );
                });
            function q() {
                var n = Object(p.a)([
                    '\n    position: absolute;\n    left: calc(100% + ',
                    ' * 2);\n    top: 50%;\n    transform: translateY(-50%);\n    white-space: nowrap;\n',
                ]);
                return (
                    (q = function () {
                        return n;
                    }),
                    n
                );
            }
            var J = Object(l.d)(M).attrs({ label: 'Backlog' })(function (n) {
                    var t = n.hasTasks,
                        e = n.theme;
                    return '\n        background-color: '
                        .concat(
                            x[e.name].SHADED,
                            ';\n        flex-grow: 1;\n        overflow: '
                        )
                        .concat(t ? 'auto' : 'visible', ';\n    ');
                }),
                W = Object(l.d)(C).attrs({ isFlexible: !0 })(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  x[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        position: relative;\n    '
                    );
                }),
                Q = function (n) {
                    var t = n.isBacklogVisibleOrDraggingTask,
                        e = n.onChangeBacklogVisibility;
                    return i.a.createElement(
                        H,
                        {
                            isActive: t,
                            title: t ? R.backlog_hide : R.backlog_show,
                            onClick: function () {
                                return e(!t);
                            },
                        },
                        t ? '\ud83d\udc48' : '\ud83d\udc49'
                    );
                },
                Z = Object(l.d)(C)(q(), v),
                $ = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = n.selectedTaskId,
                        o = n.tasks,
                        r =
                            (n.onClickTask,
                            Object(f.a)(n, [
                                'appActions',
                                'appData',
                                'selectedTaskId',
                                'tasks',
                                'onClickTask',
                            ])),
                        s = t.onChangeBacklogVisibility,
                        l = t.onChangeTaskPosition,
                        u = t.onChangeTheme,
                        d = t.onCreateTask,
                        p = t.onUpdateTask,
                        m = e.isBacklogVisibleOrDraggingTask,
                        g = e.theme,
                        h = b('task-id', function (n, t) {
                            p(n, { scheduled: !1 });
                        }),
                        v = Object(c.a)(h, 1)[0],
                        O = b('task-id', function (n, t) {
                            var a = _(t.currentTarget.dataset.taskId),
                                c = e.tasks.findIndex(function (n) {
                                    return n.id === a;
                                });
                            l(n, c);
                        }),
                        E = Object(c.a)(O, 1)[0],
                        k = o.filter(function (n) {
                            return !n.scheduled;
                        }),
                        j = o.length;
                    return i.a.createElement(
                        J,
                        r,
                        m
                            ? i.a.createElement(
                                  i.a.Fragment,
                                  null,
                                  i.a.createElement(
                                      U,
                                      null,
                                      i.a.createElement(
                                          H,
                                          {
                                              isActive: 'DARK' === g,
                                              title:
                                                  'DARK' === g
                                                      ? R.toggle_light_mode
                                                      : R.toggle_dark_mode,
                                              onClick: function () {
                                                  return u(
                                                      'LIGHT' === g
                                                          ? 'DARK'
                                                          : 'LIGHT'
                                                  );
                                              },
                                          },
                                          'LIGHT' === g
                                              ? '\ud83c\udf1a'
                                              : '\ud83c\udf1e'
                                      ),
                                      i.a.createElement(Q, {
                                          isBacklogVisibleOrDraggingTask: m,
                                          onChangeBacklogVisibility: s,
                                      })
                                  ),
                                  i.a.createElement(
                                      W,
                                      v,
                                      i.a.createElement(
                                          B,
                                          {
                                              justify: 'flex-start',
                                              direction: 'column',
                                              spacing: 1,
                                              padding: 1,
                                              style: {
                                                  bottom: 0,
                                                  left: 0,
                                                  overflow: j
                                                      ? 'auto'
                                                      : 'visible',
                                                  position: 'absolute',
                                                  right: 0,
                                                  top: 0,
                                              },
                                          },
                                          i.a.createElement(
                                              'div',
                                              {
                                                  style: {
                                                      position: 'relative',
                                                      width: '100%',
                                                  },
                                              },
                                              !j &&
                                                  i.a.createElement(
                                                      Z,
                                                      null,
                                                      i.a.createElement(
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
                                              i.a.createElement(
                                                  N,
                                                  {
                                                      style: { height: y(30) },
                                                      onClick: function () {
                                                          return d();
                                                      },
                                                  },
                                                  'New Task'
                                              )
                                          ),
                                          k.map(function (n) {
                                              return i.a.createElement(
                                                  V,
                                                  Object.assign(
                                                      {
                                                          key: n.id,
                                                          appActions: t,
                                                          appData: e,
                                                          isActive: a === n.id,
                                                          task: n,
                                                      },
                                                      E
                                                  )
                                              );
                                          })
                                      )
                                  )
                              )
                            : i.a.createElement(Q, {
                                  isBacklogVisibleOrDraggingTask: m,
                                  onChangeBacklogVisibility: s,
                              })
                    );
                });
            function nn() {
                var n = Object(p.a)([
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
                    (nn = function () {
                        return n;
                    }),
                    n
                );
            }
            function tn() {
                var n = Object(p.a)([
                    '\n    0% {\n        box-shadow: 0 0 0 0 ',
                    ';\n        transform: scale(1);\n    }\n    100% {\n        box-shadow: 0 0 50px 0 ',
                    ';\n        transform: scale(1.2);\n    }\n',
                ]);
                return (
                    (tn = function () {
                        return n;
                    }),
                    n
                );
            }
            var en = function (n) {
                    var t = n.theme;
                    return Object(l.e)(
                        tn(),
                        x[t.name].PRIMARY,
                        x[t.name].PRIMARY
                    );
                },
                an = l.d.div(function (n) {
                    var t = n.isDraggingTask,
                        e = n.isTargetedForDrop,
                        a = n.theme;
                    return Object(l.c)(
                        nn(),
                        e ? en : 'unset',
                        Object(m.d)(e ? 0 : t ? 0.35 : 0.8, x[a.name].PRIMARY),
                        '20vw',
                        '20vw',
                        '20vw',
                        t ? 'all' : 'none',
                        '20vw',
                        t ? 0.5 : 0.25,
                        '20vw',
                        T,
                        '\ud83d\uddd1',
                        '20vw',
                        '20vw'
                    );
                }),
                cn = function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = Object(f.a)(n, ['appActions', 'appData']),
                        o = t.onSelectTask,
                        r = t.onUpdateTask,
                        s = e.isDraggingTask,
                        l = b('task-id', function (n) {
                            r(n, { isComplete: !0 }),
                                o(function (t) {
                                    return t === n ? null : t;
                                });
                        }),
                        u = Object(c.a)(l, 1)[0];
                    return i.a.createElement(
                        an,
                        Object.assign({ isDraggingTask: s }, u, a)
                    );
                },
                on = e(57),
                rn = e.n(on),
                sn = e(58),
                ln = e.n(sn),
                un = e(59),
                dn = e.n(un),
                fn = ['input', 'textarea'],
                pn = function (n) {
                    return (
                        n.tagName &&
                        fn
                            .map(function (n) {
                                return n.toLowerCase();
                            })
                            .includes(n.tagName.toLowerCase())
                    );
                },
                bn = function (n) {
                    var t =
                        arguments.length > 1 && void 0 !== arguments[1]
                            ? arguments[1]
                            : { current: null };
                    Object(o.useEffect)(
                        function () {
                            var e = (function (n, t) {
                                return function (e) {
                                    var a = [];
                                    e.ctrlKey && a.push('control'),
                                        e.shiftKey && a.push('shift'),
                                        e.metaKey && a.push('cmd'),
                                        a.push(e.key);
                                    var c = dn()(a)
                                        .map(function (n) {
                                            return n.toLowerCase();
                                        })
                                        .sort()
                                        .join('+');
                                    ln()(n, function (n, a) {
                                        var o = a
                                            .split('+')
                                            .map(function (n) {
                                                return n.trim().toLowerCase();
                                            })
                                            .sort()
                                            .join('+');
                                        if (c === o) {
                                            var i = t.current,
                                                r = i && pn(i),
                                                s = pn(document.activeElement);
                                            return (
                                                r && e.stopPropagation(),
                                                !(!r && s) && n(e)
                                            );
                                        }
                                    });
                                };
                            })(n, t);
                            return (
                                document.addEventListener('keydown', e),
                                function () {
                                    return document.removeEventListener(
                                        'keydown',
                                        e
                                    );
                                }
                            );
                        },
                        [n]
                    );
                },
                mn = Object(l.d)(C).attrs({ isFlexible: !0 })(function (n) {
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
                        .concat(v, ' * 0.5 * -1);\n            right: calc(')
                        .concat(v, ' * 0.5 * -1);\n            bottom: calc(')
                        .concat(v, ' * 0.5 * -1);\n            left: calc(')
                        .concat(v, ' * 0.5 * -1);\n            ')
                        .concat(
                            T,
                            ';\n        }\n        \n        &:focus,\n        &:hover {\n            &:before {\n                opacity: 1;\n            }\n        }\n    '
                        );
                }),
                gn = Object(o.memo)(function (n) {
                    var t = n.isMultiLine,
                        e = void 0 !== t && t,
                        a = n.isRemotelyActivated,
                        r = void 0 !== a && a,
                        s = n.placeholder,
                        l = void 0 === s ? 'Empty' : s,
                        u = n.render,
                        d =
                            void 0 === u
                                ? function (n) {
                                      return n;
                                  }
                                : u,
                        p = n.value,
                        b = void 0 === p ? '' : p,
                        m = n.wrapperStyles,
                        g = void 0 === m ? {} : m,
                        h = n.onSave,
                        v = void 0 === h ? function () {} : h,
                        O = Object(f.a)(n, [
                            'isMultiLine',
                            'isRemotelyActivated',
                            'placeholder',
                            'render',
                            'value',
                            'wrapperStyles',
                            'onSave',
                        ]),
                        E = Object(o.useState)(!1),
                        k = Object(c.a)(E, 2),
                        j = k[0],
                        D = k[1],
                        T = Object(o.useState)(b),
                        R = Object(c.a)(T, 2),
                        w = R[0],
                        A = R[1],
                        x = Object(o.useState)(null),
                        y = Object(c.a)(x, 2),
                        _ = y[0],
                        B = y[1],
                        I = Object(o.useRef)(null),
                        S = Object(o.useRef)(null),
                        F = '' === w.trim(),
                        M = !e;
                    Object(o.useEffect)(
                        function () {
                            !0 === r && L();
                        },
                        [r]
                    ),
                        Object(o.useEffect)(
                            function () {
                                A(b);
                            },
                            [b]
                        ),
                        Object(o.useEffect)(
                            function () {
                                j &&
                                    I.current &&
                                    (I.current.select(), I.current.focus());
                            },
                            [I, j]
                        ),
                        Object(o.useEffect)(
                            function () {
                                var n = S.current;
                                n && B(n.offsetHeight);
                            },
                            [w, j, S]
                        );
                    var L = function () {
                            j || (A(b), D(!0));
                        },
                        N = function () {
                            v(w), D(!1);
                        },
                        H = function () {
                            A(b), D(!1);
                        },
                        X = Object(o.useMemo)(
                            function () {
                                return {
                                    'cmd + escape': H,
                                    'shift + escape': H,
                                    'cmd + enter': N,
                                    'shift + enter': N,
                                    escape: N,
                                    enter: function (n) {
                                        if (M)
                                            return N(), n.preventDefault(), !1;
                                    },
                                };
                            },
                            [H, M, N]
                        );
                    return (
                        bn(X, I),
                        i.a.createElement(
                            mn,
                            Object.assign(
                                {
                                    isEditing: j,
                                    isEmpty: F,
                                    tabIndex: 0,
                                    onClick: L,
                                },
                                O
                            ),
                            i.a.createElement(
                                C,
                                { style: g },
                                j
                                    ? i.a.createElement(
                                          i.a.Fragment,
                                          null,
                                          i.a.createElement(
                                              'div',
                                              {
                                                  ref: S,
                                                  style: {
                                                      position: 'absolute',
                                                      pointerEvents: 'none',
                                                      opacity: 0,
                                                      outline: '2px dotted red',
                                                      whiteSpace: 'pre-wrap',
                                                      width: '100%',
                                                  },
                                              },
                                              w,
                                              '.'
                                          ),
                                          i.a.createElement('textarea', {
                                              disabled: !j,
                                              ref: I,
                                              rows: 1,
                                              style: {
                                                  display: 'block',
                                                  height: ''.concat(_, 'px'),
                                                  width: '100%',
                                              },
                                              value: w,
                                              onBlur: function () {
                                                  v(w), D(!1);
                                              },
                                              onChange: function (n) {
                                                  A(n.target.value);
                                              },
                                          })
                                      )
                                    : d(F ? l : b)
                            )
                        )
                    );
                });
            function hn() {
                var n = Object(p.a)([
                    '\n    align-self: flex-start;\n    flex-grow: 0;\n    flex-shrink: 0;\n    font-size: 3rem;\n    line-height: 1.4rem;\n    width: 3rem;\n',
                ]);
                return (
                    (hn = function () {
                        return n;
                    }),
                    n
                );
            }
            function vn() {
                var n = Object(p.a)([
                    '\n    flex-grow: 1;\n    flex-shrink: 1;\n    justify-self: stretch;\n',
                ]);
                return (
                    (vn = function () {
                        return n;
                    }),
                    n
                );
            }
            var On = Object(l.d)(M)(function (n) {
                    var t = n.isLoading,
                        e = n.theme;
                    return '\n        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1);\n        border-left: 2px solid '
                        .concat(
                            x[e.name].BORDER_NEUTRAL,
                            ';\n        border-right: 2px solid '
                        )
                        .concat(
                            x[e.name].BORDER_NEUTRAL,
                            ';\n        overflow: unset;\n        z-index: 11;\n        \n        // Blackout curtain\n        &:before {\n            background-color: '
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
                En = Object(l.d)(B).attrs({
                    as: 'h1',
                    align: 'center',
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
                kn = Object(l.d)(C)(vn()),
                jn = Object(l.d)(C).attrs({ role: 'img' })(hn()),
                Dn = function (n) {
                    var t = n.appActions,
                        e = void 0 === t ? {} : t,
                        a = (n.appData, n.isCreatingTask),
                        r = void 0 !== a && a,
                        s = n.task,
                        l = void 0 === s ? {} : s,
                        u = Object(f.a)(n, [
                            'appActions',
                            'appData',
                            'isCreatingTask',
                            'task',
                        ]),
                        d = Object(o.useState)(!1),
                        p = Object(c.a)(d, 2),
                        b = p[0],
                        m = p[1],
                        v = e.onUpdateTask,
                        O = l.icon,
                        E = l.id,
                        k = l.label,
                        j = l.notes,
                        D = l.scheduled_minutes,
                        T = !l.id,
                        w = function (n, t) {
                            return v(E, { [n]: t });
                        };
                    return (
                        Object(o.useLayoutEffect)(
                            function () {
                                m(!0);
                                var n = setTimeout(function () {
                                    return m(!1);
                                }, 100);
                                return function () {
                                    return clearTimeout(n);
                                };
                            },
                            [l.id]
                        ),
                        i.a.createElement(
                            On,
                            Object.assign(
                                {
                                    isLoading: b,
                                    label: 'Selected Task Details',
                                },
                                u
                            ),
                            !T &&
                                !b &&
                                i.a.createElement(
                                    i.a.Fragment,
                                    null,
                                    i.a.createElement(Y, {
                                        renderSelectedOption: function (n) {
                                            return ''.concat(n, ' mins');
                                        },
                                        selectedOption: D,
                                        options: h,
                                        onChange: function (n) {
                                            return w('scheduled_minutes', n);
                                        },
                                    }),
                                    i.a.createElement(
                                        En,
                                        null,
                                        i.a.createElement(
                                            kn,
                                            null,
                                            i.a.createElement(gn, {
                                                isRemotelyActivated: r,
                                                placeholder: R.empty_label,
                                                value: k,
                                                onSave: function (n) {
                                                    return w('label', n);
                                                },
                                            })
                                        ),
                                        i.a.createElement(
                                            jn,
                                            null,
                                            i.a.createElement(gn, {
                                                placeholder: g,
                                                value: O,
                                                onSave: function (n) {
                                                    return w('icon', n);
                                                },
                                            })
                                        )
                                    ),
                                    i.a.createElement(gn, {
                                        isFlexible: !0,
                                        isMultiLine: !0,
                                        margin: 1,
                                        placeholder: R.empty_notes,
                                        render: function (n) {
                                            return i.a.createElement('div', {
                                                className: 'markdown',
                                                dangerouslySetInnerHTML: {
                                                    __html: rn()(n),
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
                                        value: j,
                                        onSave: function (n) {
                                            return w('notes', n);
                                        },
                                    })
                                )
                        )
                    );
                },
                Tn = e(20),
                Rn = e.n(Tn),
                wn = function (n) {
                    return n
                        ? n.split(':').map(function (n) {
                              return _(n);
                          })
                        : [0, 0];
                };
            function An() {
                var n = Object(p.a)([
                    '\n    bottom: 0;\n    height: 100%;\n    left: 0;\n    position: absolute;\n    right: 0;\n    top: 0;\n    width: 100%;\n',
                ]);
                return (
                    (An = function () {
                        return n;
                    }),
                    n
                );
            }
            var xn = l.d.div(An()),
                yn = l.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        position: relative;\n        width: 100%;\n        height: '
                        .concat(
                            y(15),
                            ';\n        z-index: 1;\n        border-top: '
                        )
                        .concat(
                            t ? '4px dotted '.concat(x[e.name].PRIMARY) : '',
                            ';\n    '
                        );
                }),
                _n = Object(o.memo)(function (n) {
                    var t,
                        e = n.appActions,
                        a = n.quarterInMinutes,
                        o = Object(f.a)(n, ['appActions', 'quarterInMinutes']),
                        r = e.onUpdateTask,
                        s = wn(j),
                        l = Object(c.a)(s, 2),
                        u = l[0],
                        d = l[1],
                        p =
                            ((t = 60 * u + d + 15 * a),
                            ''.concat(Math.floor(t / 60), ':').concat(t % 60)),
                        m = b('task-id', function (n) {
                            return r(n, { scheduled: !0, scheduled_time: p });
                        }),
                        g = Object(c.a)(m, 1)[0];
                    return i.a.createElement(yn, Object.assign({}, g, o));
                }),
                Cn = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.totalMinutes,
                        a = Object(f.a)(n, ['appActions', 'totalMinutes']);
                    return i.a.createElement(
                        xn,
                        a,
                        Rn()(e / 15).map(function (n) {
                            return i.a.createElement(_n, {
                                key: n,
                                appActions: t,
                                quarterInMinutes: n,
                            });
                        })
                    );
                });
            function Bn() {
                var n = Object(p.a)([
                    '\n    position: relative;\n    height: ',
                    ';\n',
                ]);
                return (
                    (Bn = function () {
                        return n;
                    }),
                    n
                );
            }
            function In() {
                var n = Object(p.a)(['']);
                return (
                    (In = function () {
                        return n;
                    }),
                    n
                );
            }
            var Sn = Object(l.d)(M).attrs({ label: "Today's Plan" })(In()),
                Fn = l.d.div(function (n) {
                    var t = n.isTargetedForDrop,
                        e = n.theme;
                    return '\n        bottom: 0;\n        box-shadow: '.concat(
                        t
                            ? '0 0 0 5px '.concat(
                                  x[e.name].BORDER_HOVER,
                                  ' inset'
                              )
                            : 'initial',
                        ';\n        left: 0;\n        overflow: auto;\n        position: absolute;\n        right: 0;\n        top: 0;\n        user-select: none;\n    '
                    );
                }),
                Mn = l.d.div(Bn(), y(30)),
                Ln = l.d.div(function (n) {
                    var t = n.hideLabel,
                        e = n.isFaded,
                        a = n.theme;
                    return '\n        color: '
                        .concat(
                            t
                                ? 'transparent'
                                : Object(m.d)(e ? 1 : 0, x[a.name].TEXT_FADED),
                            ';\n        padding-right: calc(100% - '
                        )
                        .concat('80px', ' + (')
                        .concat(
                            v,
                            ' * 0.5));\n        position: absolute;\n        text-align: right;\n        top: 0;\n        transform: translateY(-50%);\n        width: 100%;\n\n        &:before {\n            background-color: '
                        )
                        .concat(
                            Object(m.d)(
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
                Nn = Object(l.d)(V)(function (n) {
                    var t = n.isAnotherTaskBeingDragged,
                        e = n.offsetMinutes;
                    return '\n        left: calc('
                        .concat(v, ' * 3);\n        pointer-events: ')
                        .concat(
                            t ? 'none' : 'all',
                            ';\n        position: absolute;\n        right: '
                        )
                        .concat(v, ';\n        top: ')
                        .concat(
                            y(e),
                            ';\n        width: auto;\n        z-index: 2;\n    '
                        );
                }),
                Hn = l.d.div(function (n) {
                    var t = n.offsetMinutes;
                    return '\n        background-color: red;\n        height: 1px;\n        left: 0;\n        pointer-events: none;\n        position: absolute;\n        right: 0;\n        top: '.concat(
                        y(t),
                        ';\n        z-index: 10;\n    '
                    );
                }),
                Xn = Object(o.memo)(function (n) {
                    var t = n.appActions,
                        e = n.appData,
                        a = n.selectedTaskId,
                        r = n.from,
                        s = n.tasks,
                        l = n.to,
                        u =
                            (n.onClickTask,
                            Object(f.a)(n, [
                                'appActions',
                                'appData',
                                'selectedTaskId',
                                'from',
                                'tasks',
                                'to',
                                'onClickTask',
                            ])),
                        d = b('task-id', function () {}),
                        p = Object(c.a)(d, 1)[0],
                        m = Object(o.useState)(null),
                        g = Object(c.a)(m, 2),
                        h = g[0],
                        v = g[1],
                        O = wn(h),
                        E = Object(c.a)(O, 2),
                        k = E[0],
                        j = E[1],
                        D = wn(r),
                        T = Object(c.a)(D, 2),
                        R = T[0],
                        w = T[1],
                        A = e.isDraggingTask,
                        x = Object(o.useState)(!1),
                        y = Object(c.a)(x, 2),
                        _ = y[0],
                        C = y[1],
                        B = s.filter(function (n) {
                            return n.scheduled;
                        }),
                        I = wn(l),
                        S = Object(c.a)(I, 2),
                        F = S[0],
                        M = S[1],
                        L = F - R,
                        N = 60 * F + M - (60 * R + w),
                        H = Object(o.useRef)(null),
                        X = Object(o.useRef)(null);
                    return (
                        Object(o.useEffect)(function () {
                            var n = function () {
                                var n = new Date();
                                v(
                                    ''
                                        .concat(n.getHours(), ':')
                                        .concat(n.getMinutes())
                                ),
                                    C(!0);
                            };
                            n();
                            var t = setInterval(n, 1e3);
                            return function () {
                                return clearInterval(t);
                            };
                        }, []),
                        Object(o.useEffect)(
                            function () {
                                _ &&
                                    H.current &&
                                    X.current &&
                                    X.current.scrollTo(
                                        0,
                                        H.current.offsetTop - 150
                                    );
                            },
                            [_, H, X]
                        ),
                        i.a.createElement(
                            Sn,
                            u,
                            i.a.createElement(
                                Fn,
                                Object.assign({ ref: X }, p),
                                B.map(function (n) {
                                    var e = wn(n.scheduled_time),
                                        o = Object(c.a)(e, 2),
                                        r = 60 * o[0] + o[1] - (60 * R + w);
                                    return i.a.createElement(Nn, {
                                        key: n.id,
                                        appActions: t,
                                        isAnotherTaskBeingDragged: A,
                                        isActive: a === n.id,
                                        offsetMinutes: r,
                                        task: n,
                                    });
                                }),
                                i.a.createElement(Hn, {
                                    ref: H,
                                    offsetMinutes: 60 * k + j - (60 * R + w),
                                }),
                                i.a.createElement(Cn, {
                                    appActions: t,
                                    totalMinutes: N,
                                }),
                                Rn()(L).map(function (n) {
                                    return i.a.createElement(
                                        o.Fragment,
                                        { key: n },
                                        i.a.createElement(
                                            Mn,
                                            null,
                                            i.a.createElement(
                                                Ln,
                                                { hideLabel: 0 === n },
                                                (R + n) % 12 || 12,
                                                ':00'
                                            )
                                        ),
                                        i.a.createElement(
                                            Mn,
                                            null,
                                            i.a.createElement(
                                                Ln,
                                                { isFaded: !0 },
                                                (R + n) % 12 || 12,
                                                ':30'
                                            )
                                        )
                                    );
                                })
                            )
                        )
                    );
                }),
                Un = Object(l.b)(function (n) {
                    var t = n.theme;
                    return '\n        * {\n            background: unset;\n            border: unset;\n            box-sizing: border-box;\n            color: unset;\n            font: unset;\n            font-size: inherit;\n            line-height: 1.4em;\n            list-style-type: none;\n            margin: 0;\n            outline: unset;\n            padding: 0;\n        }\n        :root {\n            background: '
                        .concat(x[t.name].BACKGROUND, ';\n            color: ')
                        .concat(
                            x[t.name].TEXT,
                            ";\n            font-family: 'Operator Mono', monospace;\n            font-size: 15px;\n            font-weight: 300;\n            height: 100%;\n            overflow: hidden;\n        }\n        strong {\n            font-weight: 900;\n        }\n        em {\n            font-style: italic;\n        }\n        \n        .markdown {\n            * + * {\n                margin-top: calc("
                        )
                        .concat(
                            v,
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
                            v,
                            ' * 0.25);\n                \n                & + * {\n                    margin-top: '
                        )
                        .concat(
                            v,
                            ';\n                } \n            }\n        \n            blockquote {\n                border-left: 2px dotted '
                        )
                        .concat(
                            x[t.name].TEXT_FADED,
                            ';\n                font-style: italic;\n                padding: calc('
                        )
                        .concat(v, ' * 0.5) ')
                        .concat(
                            v,
                            ';\n            }\n        \n            li {\n                padding-left: '
                        )
                        .concat(
                            v,
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
                Gn = function (n, t) {
                    var e = Object(o.useState)(!1),
                        a = Object(c.a)(e, 2),
                        i = a[0],
                        r = a[1],
                        s = Object(o.useState)(t),
                        l = Object(c.a)(s, 2),
                        u = l[0],
                        d = l[1];
                    return (
                        Object(o.useEffect)(
                            function () {
                                if (!i) {
                                    var e = window.localStorage.getItem(n);
                                    d(null !== e ? JSON.parse(e) : t), r(!0);
                                }
                            },
                            [n, t, i]
                        ),
                        Object(o.useEffect)(
                            function () {
                                i &&
                                    window.localStorage.setItem(
                                        n,
                                        JSON.stringify(u)
                                    );
                            },
                            [i, n, u]
                        ),
                        [u, d]
                    );
                };
            function Yn() {
                var n = Gn('is-backlog-visible', !0),
                    t = Object(c.a)(n, 2),
                    e = t[0],
                    r = t[1],
                    s = Gn('lists', O),
                    u = Object(c.a)(s, 2),
                    f = u[0],
                    p = (u[1], Gn('selected-list-id', 1)),
                    b = Object(c.a)(p, 2),
                    m = b[0],
                    h = (b[1], Gn('selected-task-id', null)),
                    k = Object(c.a)(h, 2),
                    T = k[0],
                    w = k[1],
                    A = Gn('tasks', E),
                    x = Object(c.a)(A, 2),
                    y = x[0],
                    _ = x[1],
                    C = Gn('theme-name', 'DARK'),
                    I = Object(c.a)(C, 2),
                    S = I[0],
                    F = I[1],
                    M = Object(o.useState)(!1),
                    L = Object(c.a)(M, 2),
                    N = L[0],
                    H = L[1],
                    X = Object(o.useState)(!1),
                    U = Object(c.a)(X, 2),
                    G = U[0],
                    Y = U[1],
                    K = e || G,
                    P =
                        (Object(o.useMemo)(
                            function () {
                                return f.find(function (n) {
                                    return n.id === m;
                                });
                            },
                            [f, m]
                        ),
                        Object(o.useMemo)(
                            function () {
                                return y.find(function (n) {
                                    return n.id === T;
                                });
                            },
                            [y, T]
                        )),
                    z = Object(o.useMemo)(
                        function () {
                            return y.filter(function (n) {
                                return !n.isComplete;
                            });
                        },
                        [y]
                    ),
                    V = z.length,
                    q = function () {
                        return Y(!1);
                    };
                Object(o.useEffect)(
                    function () {
                        q();
                    },
                    [y]
                );
                var J = Object(o.useCallback)(
                        function (n, t) {
                            _(function (e) {
                                return e.map(function (e) {
                                    return e.id === n
                                        ? Object(a.a)(Object(a.a)({}, e), t)
                                        : e;
                                });
                            });
                        },
                        [_]
                    ),
                    W = Object(o.useCallback)(
                        function () {
                            var n =
                                    arguments.length > 0 &&
                                    void 0 !== arguments[0]
                                        ? arguments[0]
                                        : {},
                                t = Date.now(),
                                e = new Date(),
                                c = e.getHours(),
                                o = e.getMinutes();
                            _(function (e) {
                                return e.concat([
                                    Object(a.a)(
                                        {
                                            icon: g,
                                            id: t,
                                            list_id: m,
                                            isComplete: !1,
                                            label: ''
                                                .concat(
                                                    d()(
                                                        R.motivational_descriptors
                                                    ),
                                                    ' '
                                                )
                                                .concat(R.new_task_label),
                                            notes: R.new_task_notes,
                                            scheduled: !1,
                                            scheduled_minutes: 30,
                                            scheduled_time: ''
                                                .concat(c, ':')
                                                .concat(o),
                                        },
                                        n
                                    ),
                                ]);
                            }),
                                w(t),
                                H(!0),
                                setTimeout(function () {
                                    return H(!1);
                                }, 1e3);
                        },
                        [m, w, _]
                    ),
                    Q = w,
                    Z = r,
                    nn = F,
                    tn = Object(o.useCallback)(
                        function (n, t) {
                            _(function (e) {
                                var a = e.filter(function (t) {
                                        return t.id !== n;
                                    }),
                                    c = e.find(function (t) {
                                        return t.id === n;
                                    });
                                return [].concat(
                                    a.slice(0, t),
                                    [c],
                                    a.slice(t)
                                );
                            });
                        },
                        [_]
                    ),
                    en = Object(o.useMemo)(
                        function () {
                            return {
                                'cmd + arrowRight': function (n) {
                                    n.preventDefault(), J(T, { scheduled: !0 });
                                },
                                'cmd + arrowLeft': function (n) {
                                    n.preventDefault(), J(T, { scheduled: !1 });
                                },
                                'cmd + b': function (n) {
                                    n.preventDefault(), Z(!e);
                                },
                                'cmd + d': function (n) {
                                    n.preventDefault(),
                                        nn('LIGHT' === S ? 'DARK' : 'LIGHT');
                                },
                            };
                        },
                        [e, T, S]
                    );
                bn(en);
                var an = {
                        getTaskById: function (n) {
                            return y.find(function (t) {
                                return t.id === n;
                            });
                        },
                        onChangeBacklogVisibility: Z,
                        onChangeTaskPosition: tn,
                        onChangeTheme: nn,
                        onCreateTask: W,
                        onSelectTask: Q,
                        onUpdateTask: J,
                    },
                    on = {
                        isBacklogVisibleOrDraggingTask: K,
                        isDraggingTask: G,
                        selectedTaskId: T,
                        tasks: y,
                        theme: S,
                    };
                console.log({
                    isBacklogVisible: e,
                    isDraggingTask: G,
                    isBacklogVisibleOrDraggingTask: K,
                });
                var rn = K
                    ? { backlog: '30vw', taskDetails: '40vw', timeline: '30vw' }
                    : {
                          backlog: 'calc('.concat(v, ' * 2)'),
                          taskDetails: 'calc(60vw - '.concat(v, ' * 2)'),
                          timeline: '40vw',
                      };
                return i.a.createElement(
                    l.a,
                    { theme: { name: S } },
                    i.a.createElement(Un, null),
                    i.a.createElement(cn, { appActions: an, appData: on }),
                    i.a.createElement(
                        B,
                        {
                            align: 'stretch',
                            direction: 'row-reverse',
                            onDragOver: function () {
                                return Y(!0);
                            },
                            onDragEnd: q,
                        },
                        i.a.createElement(Xn, {
                            appActions: an,
                            appData: on,
                            selectedTaskId: T,
                            from: j,
                            style: {
                                opacity: V ? 1 : 0.25,
                                width: rn.timeline,
                                pointerEvents: V ? 'all' : 'none',
                            },
                            tasks: z,
                            to: D,
                        }),
                        i.a.createElement(Dn, {
                            appActions: an,
                            appData: on,
                            task: P,
                            isCreatingTask: N,
                            style: {
                                width: rn.taskDetails,
                                opacity: V ? 1 : 0.25,
                            },
                        }),
                        i.a.createElement($, {
                            appActions: an,
                            appData: on,
                            selectedTaskId: T,
                            style: { width: rn.backlog },
                            tasks: z,
                        })
                    )
                );
            }
            var Kn = document.getElementById('root');
            s.a.render(i.a.createElement(Yn, null), Kn);
        },
        62: function (n, t, e) {
            n.exports = e(171);
        },
    },
    [[62, 1, 2]],
]);
//# sourceMappingURL=main.83d0c182.chunk.js.map
