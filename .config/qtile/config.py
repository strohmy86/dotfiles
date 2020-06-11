import os
import re
import socket
import subprocess
from libqtile.config import Drag, Key, Screen, Group, Drag, Click, Rule
from libqtile.command import lazy
from libqtile import layout, bar, widget, hook
from libqtile.widget import Spacer
import arcobattery

#mod4 or mod = super key
mod = "mod4"
mod1 = "alt"
mod2 = "control"
home = os.path.expanduser('~')


@lazy.function
def window_to_prev_group(qtile):
    if qtile.currentWindow is not None:
        i = qtile.groups.index(qtile.currentGroup)
        qtile.currentWindow.togroup(qtile.groups[i - 1].name)

@lazy.function
def window_to_next_group(qtile):
    if qtile.currentWindow is not None:
        i = qtile.groups.index(qtile.currentGroup)
        qtile.currentWindow.togroup(qtile.groups[i + 1].name)

keys = [

# FUNCTION KEYS

    Key([], "F12", lazy.spawn('xfce4-terminal --drop-down')),
    Key([], "Pause", lazy.spawn('betterlockscreen -l dimblur')),
# SUPER + FUNCTION KEYS

    Key([mod], "e", lazy.spawn('subl3')),
    Key([mod], "f", lazy.spawn('pcmanfm')),
    Key([mod], "p", lazy.spawn('dmenu_run -p "Run: "')),
    Key([mod], "v", lazy.spawn('pavucontrol')),
    Key([mod], "b", lazy.spawn('google-chrome-stable')),
    Key([mod, "shift"], "c", lazy.window.kill()),
    Key([mod], "Return", lazy.spawn('alacritty -e fish')),
    Key([mod], "KP_Enter", lazy.spawn('alacritty -e fish')),

# SUPER + SHIFT KEYS

    Key([mod, "shift"], "Return", lazy.spawn('pcmanfm')),
    Key([mod, "shift"], "r", lazy.restart()),
    Key([mod, "shift"], "q", lazy.shutdown()),

# CONTROL + ALT KEYS

    Key(["mod1", "control"], "Return", lazy.spawn('alacritty -e fish')),

# SCREENSHOTS

    Key([], "Print", lazy.spawn("scrot 'ArchLinux-%Y-%m-%d-%s_screenshot_$wx$h.jpg' -e 'mv $f $$(xdg-user-dir PICTURES)'")),
    Key([mod2], "Print", lazy.spawn('xfce4-screenshooter')),


# CONTROL + SHIFT KEYS

    Key([mod2, "shift"], "Escape", lazy.spawn('xfce4-taskmanager')),

# MULTIMEDIA KEYS

# INCREASE/DECREASE/MUTE VOLUME
    Key([], "XF86AudioMute", lazy.spawn("amixer -q set Master toggle")),
    Key([], "XF86AudioLowerVolume", lazy.spawn("amixer -q set Master 5%-")),
    Key([], "XF86AudioRaiseVolume", lazy.spawn("amixer -q set Master 5%+")),

    Key([], "XF86AudioPlay", lazy.spawn("playerctl play-pause")),
    Key([], "XF86AudioNext", lazy.spawn("playerctl next")),
    Key([], "XF86AudioPrev", lazy.spawn("playerctl previous")),
    Key([], "XF86AudioStop", lazy.spawn("playerctl stop")),

#    Key([], "XF86AudioPlay", lazy.spawn("mpc toggle")),
#    Key([], "XF86AudioNext", lazy.spawn("mpc next")),
#    Key([], "XF86AudioPrev", lazy.spawn("mpc prev")),
#    Key([], "XF86AudioStop", lazy.spawn("mpc stop")),

# QTILE LAYOUT KEYS
    Key([mod], "n", lazy.layout.normalize()),
    Key([mod], "Tab", lazy.next_layout()),

# WINDOW CONTROLS
    Key([mod], "k", lazy.layout.down()),
    Key([mod], "j", lazy.layout.up()),
    Key([mod], "h", lazy.layout.shrink(), lazy.layout.increase_nmaster()),
    Key([mod], "l", lazy.layout.grow(), lazy.layout.decrease_nmaster()),
    Key([mod, "shift"], "k", lazy.layout.shuffle_down()),
    Key([mod, "shift"], "j", lazy.layout.shuffle_up()),

# FLIP LAYOUT FOR MONADTALL/MONADWIDE
    Key([mod, "shift"], "f", lazy.layout.flip()),

# TOGGLE FLOATING LAYOUT
    Key([mod, "shift"], "space", lazy.window.toggle_floating()),]

groups = []

# FOR QWERTY KEYBOARDS
group_names = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0",]

# FOR AZERTY KEYBOARDS
#group_names = ["ampersand", "eacute", "quotedbl", "apostrophe", "parenleft", "section", "egrave", "exclam", "ccedilla", "agrave",]

#group_labels = ["1 ", "2 ", "3 ", "4 ", "5 ", "6 ", "7 ", "8 ", "9 ", "0",]
group_labels = ["", "", "", "", "", "", "", "", "", "",]
#group_labels = ["Web", "Edit/chat", "Image", "Gimp", "Meld", "Video", "Vb", "Files", "Mail", "Music",]

group_layouts = ["monadtall", "monadtall", "monadtall", "monadtall", "monadtall", "monadtall", "monadtall", "monadtall", "monadtall", "monadtall",]
#group_layouts = ["monadtall", "matrix", "monadtall", "bsp", "monadtall", "matrix", "monadtall", "bsp", "monadtall", "monadtall",]

for i in range(len(group_names)):
    groups.append(
        Group(
            name=group_names[i],
            layout=group_layouts[i].lower(),
            label=group_labels[i],
        ))

for i in groups:
    keys.extend([

#CHANGE WORKSPACES
        Key([mod], i.name, lazy.group[i.name].toscreen()),
        Key(["shift"], "Tab", lazy.screen.next_group()),
        Key(["mod1", "shift"], "Tab", lazy.screen.prev_group()),

# MOVE WINDOW TO SELECTED WORKSPACE 1-10 AND STAY ON WORKSPACE
        Key([mod, "shift"], i.name, lazy.window.togroup(i.name)),
# MOVE WINDOW TO SELECTED WORKSPACE 1-10 AND FOLLOW MOVED WINDOW TO WORKSPACE
        #Key([mod, "shift"], i.name, lazy.window.togroup(i.name) , lazy.group[i.name].toscreen()),
    ])


def init_layout_theme():
    return {"margin":5,
            "border_width":2,
            "border_focus": "#5e81ac",
            "border_normal": "#4c566a"
            }

layout_theme = init_layout_theme()


layouts = [
    layout.MonadTall(margin=8, border_width=2, border_focus="#5e81ac", border_normal="#4c566a"),
    layout.MonadWide(margin=8, border_width=2, border_focus="#5e81ac", border_normal="#4c566a"),
    layout.Matrix(**layout_theme),
    layout.Bsp(**layout_theme),
    layout.Floating(**layout_theme),
    layout.RatioTile(**layout_theme),
    layout.Max(**layout_theme)
]
# QUERY KERNEL VERSION

def kernel():
    result = os.popen('uname -r'.rstrip('\r\n')).read()
    return result

# COLORS FOR THE BAR

def init_colors():
    return [["#2F343F", "#2F343F"], # color 0
            ["#2F343F", "#2F343F"], # color 1
            ["#c0c5ce", "#c0c5ce"], # color 2
            ["#fba922", "#fba922"], # color 3
            ["#3384d0", "#3384d0"], # color 4
            ["#f3f4f5", "#f3f4f5"], # color 5
            ["#cd1f3f", "#cd1f3f"], # color 6
            ["#62FF00", "#62FF00"], # color 7
            ["#6790eb", "#6790eb"], # color 8
            ["#a9a9a9", "#a9a9a9"]] # color 9


colors = init_colors()


# WIDGETS FOR THE BAR

def init_widgets_defaults():
    return dict(font="Noto Sans",
                fontsize = 12,
                padding = 2,
                background=colors[1])

widget_defaults = init_widgets_defaults()

def init_widgets_list():
    prompt = "{0}@{1}: ".format(os.environ["USER"], socket.gethostname())
    widgets_list = [
                widget.GroupBox(font="FontAwesome",
                        fontsize = 16,
                        margin_y = 2,
                        margin_x = 0,
                        padding_y = 6,
                        padding_x = 5,
                        borderwidth = 0,
                        disable_drag = True,
                        active = colors[9],
                        inactive = colors[5],
                        rounded = False,
                        highlight_method = "text",
                        this_current_screen_border = colors[8],
                        foreground = colors[2],
                        background = colors[1],
                        ),
                widget.Sep(
                        linewidth = 1,
                        padding = 10,
                        foreground = colors[2],
                        background = colors[1],
                        ),
                widget.CurrentLayout(
                        font = "Noto Sans Bold",
                        foreground = colors[5],
                        background = colors[1],
                        ),
                widget.Sep(
                        linewidth = 1,
                        padding = 10,
                        foreground = colors[2],
                        background = colors[1],
                        ),
                widget.WindowName(font="Noto Sans",
                        fontsize = 12,
                        foreground = '#b3c5c9',
                        background = colors[1],
                        ),
                #widget.Sep(
                #        linewidth = 1,
                #        padding = 10,
                #        foreground = colors[2],
                #        background = colors[1]
                #        ),
                #arcobattery.BatteryIcon(
                #        padding=0,
                #        scale=0.7,
                #        y_poss=2,
                #        theme_path=home + "/.config/qtile/icons/battery_icons_horiz",
                #        update_interval = 5,
                #        background = colors[1]
                #        ),
                #widget.TextBox(
                #        font="FontAwesome",
                #        text="  ",
                #        foreground='#a1a197',
                #        background=colors[1],
                #        padding = 0,
                #        fontsize=16,
                #        ),
                #widget.GenPollText(
                #        font="Noto Sans",
                #        fontsize = 12,
                #        func = kernel,
                #        update_interval = 600,
                #        foreground=colors[2],
                #        background=colors[1],
                #        padding = 0,
                #        ),
                #widget.Sep(
                #        linewidth = 1,
                #        padding = 10,
                #        foreground = colors[2],
                #        background = colors[1],
                #        ),
                widget.TextBox(
                        font="FontAwesome",
                        text=" ⟳ ",
                        foreground='#d479cf',
                        background=colors[1],
                        padding = 0,
                        fontsize=18,
                        ),
                widget.Pacman(
                        font="Noto Sans",
                        fontsize = 12,
                        update_interval = 10,
                        foreground=colors[2],
                        background=colors[1],
                        padding = 0,
                        ),
                widget.Sep(
                        linewidth = 1,
                        padding = 10,
                        foreground = colors[2],
                        background = colors[1],
                        ),
                widget.TextBox(
                        font="FontAwesome",
                        text=" 🌡",
                        foreground='#ff008c',
                        background=colors[1],
                        padding = 0,
                        fontsize=14,
                        ),
                widget.ThermalSensor(
                        foreground = colors[5],
                        foreground_alert = colors[6],
                        background = colors[1],
                        metric = True,
                        padding = 3,
                        threshold = 80
                        ),
                widget.Sep(
                        linewidth = 1,
                        padding = 10,
                        foreground = colors[2],
                        background = colors[1],
                        ),
                #widget.TextBox(
                #        font="FontAwesome",
                #        text=" ",
                #        foreground=colors[7],
                #        background=colors[1],
                #        padding = 0,
                #        fontsize=18,
                #        ),
                #widget.Net(
                #        font="Noto Sans",
                #        fontsize = 12,
                #        interface="wlp62s0",
                #        format = '{down} ⇵{up}',
                #        update_interval = 0.3,
                #        foreground=colors[2],
                #        background=colors[1],
                #        padding = 0,
                #        ),
                #widget.Sep(
                #        linewidth = 1,
                #        padding = 10,
                #        foreground = colors[2],
                #        background = colors[1],
                #        ),
                widget.TextBox(
                        font="FontAwesome",
                        text="  ",
                        foreground=colors[6],
                        background=colors[1],
                        padding = 0,
                        fontsize=16,
                        ),
                widget.CPU(
                        format= '{freq_current} GHz',
                        forefround=colors[2],
                        background=colors[1],
                        padding = 0,
                        ),
                widget.Sep(
                        linewidth = 1,
                        padding = 10,
                        foreground = colors[2],
                        background = colors[1],
                        ),
                widget.TextBox(
                        font="FontAwesome",
                        text="  ",
                        foreground=colors[4],
                        background=colors[1],
                        padding = 0,
                        fontsize=16,
                        ),
                widget.Memory(
                        font="Noto Sans",
                        format = '{MemUsed} MB / {MemTotal} MB',
                        update_interval = 1,
                        fontsize = 12,
                        foreground = colors[5],
                        background = colors[1],
                       ),
                widget.Sep(
                        linewidth = 1,
                        padding = 10,
                        foreground = colors[2],
                        background = colors[1],
                        ),
                #widget.TextBox(
                #        font="FontAwesome",
                #        text="  ",
                #        foreground="#0ec5e6",
                #        background=colors[1],
                #        padding = 0,
                #        fontsize=16,
                #        ),
                #widget.DF(
                #        font="Noto Sans",
                #        visible_on_warn = False,
                #        measure = 'G',
                #        format = 'Free: {uf}GB / {s}GB',
                #        update_interval = 1,
                #        fontsize = 12,
                #        foreground = colors[5],
                #        background = colors[1],
                #       ),
                #widget.Sep(
                #        linewidth = 1,
                #        padding = 10,
                #        foreground = colors[2],
                #        background = colors[1],
                #        ),
                widget.TextBox(
                        font="FontAwesome",
                        text="  ",
                        foreground=colors[3],
                        background=colors[1],
                        padding = 0,
                        fontsize=16,
                        ),
                widget.Clock(
                        foreground = colors[5],
                        background = colors[1],
                        fontsize = 12,
                        format="%Y-%m-%d %H:%M",
                        ),
                widget.Sep(
                        linewidth = 1,
                        padding = 10,
                        foreground = colors[2],
                        background = colors[1],
                        ),
                widget.Systray(
                        background=colors[1],
                        icon_size=20,
                        padding = 4,
                        ),
                ]
    return widgets_list

widgets_list = init_widgets_list()


def init_widgets_screen1():
    widgets_screen1 = init_widgets_list()
    return widgets_screen1

def init_widgets_screen2():
    widgets_screen2 = init_widgets_list()
    return widgets_screen2

widgets_screen1 = init_widgets_screen1()
widgets_screen2 = init_widgets_screen2()


def init_screens():
    return [Screen(top=bar.Bar(widgets=init_widgets_screen1(), size=20)),
            Screen(top=bar.Bar(widgets=init_widgets_screen2(), size=20))]
screens = init_screens()


# MOUSE CONFIGURATION
mouse = [
    Drag([mod], "Button1", lazy.window.set_position_floating(),
         start=lazy.window.get_position()),
    Drag([mod], "Button3", lazy.window.set_size_floating(),
         start=lazy.window.get_size())
]

dgroups_key_binder = None
dgroups_app_rules = []

# ASSIGN APPLICATIONS TO A SPECIFIC GROUPNAME
# BEGIN

@hook.subscribe.client_new
def assign_app_group(client):
    d = {}
    #########################################################
    ################ assgin apps to groups ##################
    #########################################################
    d["1"] = ["Navigator", "Firefox", "Vivaldi-stable", "Vivaldi-snapshot", "Chromium", "Google-chrome", "Brave", "Brave-browser",
              "navigator", "firefox", "vivaldi-stable", "vivaldi-snapshot", "chromium", "google-chrome", "brave", "brave-browser", ]
    d["2"] = ["Atom", "Subl3", "Geany", "Brackets", "Code-oss", "Code", "Alacritty",
              "atom", "subl3", "geany", "brackets", "code-oss", "code", "alacritty"]
    d["3"] = ["Inkscape", "Nomacs", "Ristretto", "Nitrogen", "Feh",
              "inkscape", "nomacs", "ristretto", "nitrogen", "feh", ]
    d["4"] = ["Gimp", "gimp"]
    d["5"] = ["Meld", "meld", "org.gnome.meld" "org.gnome.Meld"]
    d["6"] = ["Vlc","vlc", "Mpv", "mpv", "Kdenlive", "kdenlive"]
    d["7"] = ["VirtualBox Manager", "VirtualBox Machine", "Vmplayer", "Virt-Manager",
              "virtualbox manager", "virtualbox machine", "vmplayer", "virt-manager"]
    d["8"] = ["Thunar", "Nemo", "Caja", "Nautilus", "org.gnome.Nautilus", "Pcmanfm", "Pcmanfm-qt",
              "thunar", "nemo", "caja", "nautilus", "org.gnome.nautilus", "pcmanfm", "pcmanfm-qt", ]
    d["9"] = ["Evolution", "Geary", "Mail", "Thunderbird", "Telegram-Desktop", "Discord",
              "evolution", "geary", "mail", "thunderbird", "telegram-desktop", "discord"]
    d["0"] = ["Spotify", "Pragha", "Clementine", "Deadbeef", "Audacious",
              "spotify", "pragha", "clementine", "deadbeef", "audacious"]
    ##########################################################
    wm_class = client.window.get_wm_class()[0]

    for i in range(len(d)):
        if wm_class in list(d.values())[i]:
            group = list(d.keys())[i]
            client.togroup(group)
            client.group.cmd_toscreen()

# END
# ASSIGN APPLICATIONS TO A SPECIFIC GROUPNAME



main = None

@hook.subscribe.startup_once
def start_once():
    home = os.path.expanduser('~')
    subprocess.call([home + '/.config/qtile/scripts/autostart.sh'])

@hook.subscribe.startup
def start_always():
    # Set the cursor to something sane in X
    subprocess.Popen(['xsetroot', '-cursor_name', 'left_ptr'])

@hook.subscribe.client_new
def set_floating(window):
    if (window.window.get_wm_transient_for()
            or window.window.get_wm_type() in floating_types):
        window.floating = True

floating_types = ["notification", "toolbar", "splash", "dialog"]


follow_mouse_focus = True
bring_front_click = False
cursor_warp = False
floating_layout = layout.Floating(float_rules=[
    {'wmclass': 'confirm'},
    {'wmclass': 'dialog'},
    {'wmclass': 'download'},
    {'wmclass': 'error'},
    {'wmclass': 'file_progress'},
    {'wmclass': 'notification'},
    {'wmclass': 'splash'},
    {'wmclass': 'toolbar'},
    {'wmclass': 'confirmreset'},
    {'wmclass': 'makebranch'},
    {'wmclass': 'maketag'},
    {'wmclass': 'Arandr'},
    {'wmclass': 'feh'},
    {'wmclass': 'Galculator'},
    {'wmclass': 'xfce4-terminal'},
    {'wname': 'branchdialog'},
    {'wname': 'Open File'},
    {'wname': 'pinentry'},
    {'wmclass': 'ssh-askpass'},
    {'wmclass': 'megasync'},
],  fullscreen_border_width = 0, border_width = 0)
auto_fullscreen = True

focus_on_window_activation = "focus" # or smart

wmname = "LG3D"
