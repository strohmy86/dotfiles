#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

PS1='[\u@\h \W]\$ '

#list
alias ls='ls --color=auto'
alias la='ls -a'
alias ll='ls -la'
alias l='ls' 					
alias l.="ls -A | egrep '^\.'"      

#fix obvious typo's
alias cd..='cd ..'
alias sl="ls"
alias pdw="pwd"

## Colorize the grep command output for ease of use (good for log files)##
alias grep='grep --color=auto'
alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'

#readable output
alias mount='mount |column -t'
alias df='df -h'

alias merge="xrdb -merge ~/.Xresources"

# Aliases for software managment
# pacman or pm
alias pmsyu="sudo pacman -Syu --color=auto"
alias pacman='sudo pacman --color auto'
alias update='sudo pacman -Syu'
# pacaur or pc
alias pcsyu="pacaur -Syu"
# packer or pk
alias pks="packer -S"
alias pksn="packer -S --noconfirm --noedit"
alias pksyu="packer -Syu  --noconfirm --noedit"


neofetch
EDITOR=nano

alias gam="/home/lstrohm/bin/gam/gam"
