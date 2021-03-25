//META{"name":"NotificationBypasser"}*//

class NotificationBypasser {
    getName() {
        return "Notification Bypasser";
    }
    getDescription() {
        return "Get notifications from specific server's when notifications are off or on dnd.";
    }
    getVersion() {
        return "0.0.2";
    }
    getAuthor() {
        return "Yakov";
    }
    load() {
        this.getChannelById = BdApi.findModuleByProps('getChannel').getChannel;
        this.getServerById = BdApi.findModuleByProps('getGuild').getGuild;
        this.transitionTo = BdApi.findModuleByProps('transitionTo').transitionTo;
        this.isMuted = BdApi.findModuleByProps('isGuildOrCategoryOrChannelMuted').isGuildOrCategoryOrChannelMuted.bind(BdApi.findModuleByProps('isGuildOrCategoryOrChannelMuted'));
        this.isBlocked = BdApi.findModuleByProps('isBlocked').isBlocked;
        this.getUnreadCount = BdApi.findModuleByProps('getUnreadCount').getUnreadCount;
        this.currentChannel = BdApi.findModuleByProps("getChannelId").getChannelId;
        this.userId = BdApi.findModuleByProps('getId').getId();
    }
    start() {
        this.cancelPatch = BdApi.monkeyPatch(BdApi.findModuleByProps("dispatch"), 'dispatch', { after: this.dispatch.bind(this) });
        this.whitelist = BdApi.loadData('NotificationBypasser', 'whitelist') || [];
        this.enableiffocused = BdApi.loadData('NotificationBypasser', 'enableiffocused') || true;
    }
    stop() {
        this.cancelPatch();
    }
    dispatch(data) {
        if (data.methodArguments[0].type !== 'MESSAGE_CREATE')
            return;
        const message = data.methodArguments[0].message;
        if (!this.whitelist.includes(message.guild_id))
            return;
        if (this.currentChannel() === message.channel_id && this.enableiffocused && require('electron').remote.getCurrentWindow().isFocused())
            return;
        if (this.isMuted(message.guild_id, message.channel_id))
            return;
        const author = message.author;
        if (message.author.id === this.userId)
            return;
        if (this.isBlocked(author.id))
            return;
        let content = message.content;
        const channel = this.getChannelById(message.channel_id);
        const server = this.getServerById(message.guild_id);
        const notification = new Notification(`${server.name} #${channel.name} (${this.getUnreadCount(channel.id)} unread)`, { body: `${author.username}: ${content}` });
        notification.addEventListener('click', _ => {
            this.goToMessage(server.id, channel.id, message.id);
        });
    }
    goToMessage(server, channel, message) {
        require('electron').remote.getCurrentWindow().focus();
        this.transitionTo(`/channels/${server}/${channel}/${message}`);
        this.transitionTo(`/channels/${server}/${channel}/${message}`);
    }
    getSettingsPanel() {
        const div = document.createElement('div');
        const allowT = document.createElement('h6');
        const allow = document.createElement('textarea');
        const div2 = document.createElement('div');
        const checkboxT = document.createElement('h6');
        const checkbox = document.createElement('input');
        const br = document.createElement('br');
        const button = document.createElement('button');
        button.innerText = 'Apply';
        button.style.cssFloat = 'right';
        button.style.backgroundColor = '#3E82E5';
        button.style.color = 'white';
        button.style.fontSize = '100%';
        allowT.innerText = 'Allowed Servers';
        allowT.style.marginTop = '0.5ch';
        allowT.style.marginBottom = '0.25ch';
        allow.placeholder = 'List of server IDs to get notified by (e.g. "47956381050833507, 602266600811141036")';
        allow.value = this.whitelist.join(', ');
        allow.style.width = '100%';
        allow.style.minHeight = '6ch';
        div2.style.display = 'flex';
        div2.style.justifyContent = 'space-between';
        checkboxT.innerText = 'Notify even if discord window is focused';
        checkboxT.style.marginTop = '0.5ch';
        checkboxT.style.marginBottom = '0.25ch';
        checkbox.type = 'checkbox';
        checkbox.checked = this.enableiffocused;
        button.addEventListener('click', _ => {
            button.innerText = 'Applied!';
            setTimeout(function () {
                button.innerText = 'Apply';
            }, 1000);
            this.whitelist = allow.value.split(',').map(e => e.trim());
            BdApi.saveData('NotificationBypasser', 'whitelist', this.whitelist);
            this.enableiffocused = checkbox.checked;
            BdApi.saveData('NotificationBypasser', 'enableiffocused', this.enableiffocused);
        });
        div.appendChild(allowT);
        div.appendChild(allow);
        div2.appendChild(checkboxT);
        div2.appendChild(checkbox);
        div.appendChild(div2);
        div.appendChild(br);
        div.appendChild(button);
        return div;
    }
}
