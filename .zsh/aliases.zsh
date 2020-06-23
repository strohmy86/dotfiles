# Aliases

alias nf='ls | wc -l'
alias rr='rm -rf'
#alias ls='ls $LS_OPTIONS -hF --group-directories-first'
alias ls='exa -alh --color=always --group-directories-first'
#alias la="ls -R | grep ":$" | sed -e 's/:$//' -e 's/[^-][^\/]*\//--/g' -e 's/^/ /' -e 's/-/|/'"
alias c="clear"
alias find_empty_files="find ~/ -empty -type f"
alias delete_empty_files="find ~/ -empty -type f -delete"
alias find_empty_directories="find ~/ -empty -type d"
alias delete_empty_directories="find ~/ -empty -type d -delete"
alias vi='vim'
alias top='htop'
alias gam='~/bin/gamadv-xtd3/gam'
alias weather='/usr/bin/wunderground.py'
alias xz='xz --threads=0'
alias updategam='bash <(curl -s -S -L https://git.io/fhZWP) -l -d ~/bin/'
alias connect='sudo openconnect -b -q -U lstrohm https://vpn2.ncocc-k12.org/mad --user=strohm.luke'
alias disconnect='sudo pkill -SIGINT openconnect && sudo ip r | grep ppp0 && sudo ip r | grep default | head -n1 | xargs sudo ip r del'
alias gyb='~/bin/gyb/gyb'
alias config='git --git-dir=/home/lstrohm/.cfg --work-tree=/home/lstrohm'
