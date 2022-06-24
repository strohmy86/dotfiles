# Aliases
alias nf='ls | wc -l'

alias rr='rm -rf'
#alias ls='ls $LS_OPTIONS -hF --group-directories-first'
alias ls='exa -algh --git --color=always --group-directories-first'
alias ll='ls $LS_OPTIONS -lAhF --group-directories-first'
#alias la="ls -R | grep ":$" | sed -e 's/:$//' -e 's/[^-][^\/]*\//--/g' -e 's/^/ /' -e 's/-/|/'"
alias c="clear"

alias find_empty_files="find ≈ -empty -type f"
alias delete_empty_files="find ~/Documents/ -empty -type f -delete"

alias find_empty_directories="find ~/Documents/ -empty -type d"
alias delete_empty_directories="find ~/Documents/ -empty -type d -delete"

alias vi='vim'
alias top='htop'
#alias neofetch='~/neofetch/neofetch'
alias gam='~/bin/gamadv-xtd3/gam'
alias fierce='fierce.pl'
alias weather='/usr/bin/wunderground.py'
alias xz='xz --threads=0'
alias gamprt='~/bin/gamprt/gam'
alias pacaur='yay'
alias updategam='curl -s -S -L https://git.io/fhZWP > ~/bin/gam-install.sh && bash ~/bin/gam-install.sh -l -d ~/bin/'
alias dnf='sudo dnf'

alias connect='sudo openconnect -b -q -U lstrohm https://vpn2.ncocc-k12.org/mad --user=strohm.luke'
alias disconnect='sudo pkill -SIGINT openconnect && sudo ip r | grep ppp0 && sudo ip r | grep default | head -n1 | xargs sudo ip r del'
alias gyb='~/bin/gyb/gyb'
alias config='git --git-dir=/home/lstrohm/.cfg/ --work-tree=/home/lstrohm'
