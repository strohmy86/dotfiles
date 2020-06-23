
#-- Autoloads --#
autoload -U colors && colors
autoload -U promptinit && promptinit
zmodload -i zsh/complist

if [ "$TERM" != "dumb" ]; then
    export LS_OPTIONS='--color=auto'
    eval `dircolors ~/.dir_colors`
fi

