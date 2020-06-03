# update function
function update() {
    local brew="brew update; brew upgrade; brew cleanup;"
    # local gem="gem update;"
    local pip="python ~/.config/update/update.py"
    sh -c $brew; sh -c $gem ; sh -c $pip
    brew cleanup
    brew cask cleanup
}


# function hello() { ssh "snicolis@164.15.136.219" }




# cd to current directory
cdf() {
    target=`osascript -e 'tell application "Finder" to if (count of Finder windows) > 0 then get POSIX path of (target of front Finder window as text)'`
    if [ "$target" != "" ]; then
        cd "$target"; pwd
    else
        echo 'No Finder window found' >&2
    fi
}

#   Update all Wallpapers
function wallpaper() {
    sqlite3 ~/Library/Application\ Support/Dock/desktoppicture.db "update data set value = '$1'" && killall Dock
}

