//removeStopWords from http://geeklad.com/remove-stop-words-in-javascript
String.prototype.removeStopWords = function() {
    var x;
    var y;
    var word;
    var stop_word;
    var regex_str;
    var regex;
    var cleansed_string = this.valueOf();
    var stop_words = new Array(
        'a',
        'about',
        'above',
        'across',
        'after',
        'again',
        'against',
        'all',
        'almost',
        'alone',
        'along',
        'already',
        'also',
        'although',
        'always',
        'among',
        'an',
        'and',
        'another',
        'any',
        'anybody',
        'anyone',
        'anything',
        'anywhere',
        'are',
        'area',
        'areas',
        'around',
        'as',
        'ask',
        'asked',
        'asking',
        'asks',
        'at',
        'away',
        'b',
        'back',
        'backed',
        'backing',
        'backs',
        'be',
        'became',
        'because',
        'become',
        'becomes',
        'been',
        'before',
        'began',
        'behind',
        'being',
        'beings',
        'best',
        'better',
        'between',
        'big',
        'both',
        'but',
        'by',
        'c',
        'came',
        'can',
        'cannot',
        'case',
        'cases',
        'certain',
        'certainly',
        'clear',
        'clearly',
        'come',
        'could',
        'd',
        'did',
        'differ',
        'different',
        'differently',
        'do',
        'does',
        'done',
        'down',
        'down',
        'downed',
        'downing',
        'downs',
        'during',
        'e',
        'each',
        'early',
        'either',
        'end',
        'ended',
        'ending',
        'ends',
        'enough',
        'even',
        'evenly',
        'ever',
        'every',
        'everybody',
        'everyone',
        'everything',
        'everywhere',
        'f',
        'face',
        'faces',
        'fact',
        'facts',
        'far',
        'felt',
        'few',
        'find',
        'finds',
        'first',
        'for',
        'four',
        'from',
        'full',
        'fully',
        'further',
        'furthered',
        'furthering',
        'furthers',
        'g',
        'gave',
        'general',
        'generally',
        'get',
        'gets',
        'give',
        'given',
        'gives',
        'go',
        'going',
        'good',
        'goods',
        'got',
        'great',
        'greater',
        'greatest',
        'group',
        'grouped',
        'grouping',
        'groups',
        'h',
        'had',
        'has',
        'have',
        'having',
        'he',
        'her',
        'here',
        'herself',
        'high',
        'high',
        'high',
        'higher',
        'highest',
        'him',
        'himself',
        'his',
        'how',
        'however',
        'i',
        'if',
        'important',
        'in',
        'interest',
        'interested',
        'interesting',
        'interests',
        'into',
        'is',
        'it',
        'its',
        'itself',
        'j',
        'just',
        'k',
        'keep',
        'keeps',
        'kind',
        'knew',
        'know',
        'known',
        'knows',
        'l',
        'large',
        'largely',
        'last',
        'later',
        'latest',
        'least',
        'less',
        'let',
        'lets',
        'like',
        'likely',
        'long',
        'longer',
        'longest',
        'm',
        'made',
        'make',
        'making',
        'man',
        'many',
        'may',
        'me',
        'member',
        'members',
        'men',
        'might',
        'more',
        'most',
        'mostly',
        'mr',
        'mrs',
        'much',
        'must',
        'my',
        'myself',
        'n',
        'necessary',
        'need',
        'needed',
        'needing',
        'needs',
        'never',
        'new',
        'new',
        'newer',
        'newest',
        'next',
        'no',
        'nobody',
        'non',
        'noone',
        'not',
        'nothing',
        'now',
        'nowhere',
        'number',
        'numbers',
        'o',
        'of',
        'off',
        'often',
        'old',
        'older',
        'oldest',
        'on',
        'once',
        'one',
        'only',
        'open',
        'opened',
        'opening',
        'opens',
        'or',
        'order',
        'ordered',
        'ordering',
        'orders',
        'other',
        'others',
        'our',
        'out',
        'over',
        'p',
        'part',
        'parted',
        'parting',
        'parts',
        'per',
        'perhaps',
        'place',
        'places',
        'point',
        'pointed',
        'pointing',
        'points',
        'possible',
        'present',
        'presented',
        'presenting',
        'presents',
        'problem',
        'problems',
        'put',
        'puts',
        'q',
        'quite',
        'r',
        'rather',
        'really',
        'right',
        'right',
        'room',
        'rooms',
        's',
        'said',
        'same',
        'saw',
        'say',
        'says',
        'second',
        'seconds',
        'see',
        'seem',
        'seemed',
        'seeming',
        'seems',
        'sees',
        'several',
        'shall',
        'she',
        'should',
        'show',
        'showed',
        'showing',
        'shows',
        'side',
        'sides',
        'since',
        'small',
        'smaller',
        'smallest',
        'so',
        'some',
        'somebody',
        'someone',
        'something',
        'somewhere',
        'state',
        'states',
        'still',
        'still',
        'such',
        'sure',
        't',
        'take',
        'taken',
        'than',
        'that',
        'the',
        'their',
        'them',
        'then',
        'there',
        'therefore',
        'these',
        'they',
        'thing',
        'things',
        'think',
        'thinks',
        'this',
        'those',
        'though',
        'thought',
        'thoughts',
        'three',
        'through',
        'thus',
        'to',
        'today',
        'together',
        'too',
        'took',
        'toward',
        'turn',
        'turned',
        'turning',
        'turns',
        'two',
        'u',
        'under',
        'until',
        'up',
        'upon',
        'us',
        'use',
        'used',
        'uses',
        'v',
        'very',
        'w',
        'want',
        'wanted',
        'wanting',
        'wants',
        'was',
        'way',
        'ways',
        'we',
        'well',
        'wells',
        'went',
        'were',
        'what',
        'when',
        'where',
        'whether',
        'which',
        'while',
        'who',
        'whole',
        'whose',
        'why',
        'will',
        'with',
        'within',
        'without',
        'work',
        'worked',
        'working',
        'works',
        'would',
        'x',
        'y',
        'year',
        'years',
        'yet',
        'you',
        'young',
        'younger',
        'youngest',
        'your',
        'yours',
        'z'
    )
         
    // Split out all the individual words in the phrase
    words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g)
 
    // Review all the words
    for(x=0; x < words.length; x++) {
        // For each word, check all the stop words
        for(y=0; y < stop_words.length; y++) {
            // Get the current word
            word = words[x].replace(/\s+|[^a-z]+/ig, "");   // Trim the word and remove non-alpha
             
            // Get the stop word
            stop_word = stop_words[y];
             
            // If the word matches the stop word, remove it from the keywords
            if(word.toLowerCase() == stop_word) {
                // Build the regex
                regex_str = "^\\s*"+stop_word+"\\s*$";      // Only word
                regex_str += "|^\\s*"+stop_word+"\\s+";     // First word
                regex_str += "|\\s+"+stop_word+"\\s*$";     // Last word
                regex_str += "|\\s+"+stop_word+"\\s+";      // Word somewhere in the middle
                regex = new RegExp(regex_str, "ig");
             
                // Remove the word from the keywords
                cleansed_string = cleansed_string.replace(regex, " ");
            }
        }
    }
    return cleansed_string.replace(/^\s+|\s+$/g, "");
}

String.prototype.removeLanguageCodes = function() {
    var x;
    var y;
    var word;
    var stop_word;
    var regex_str;
    var regex;
    var cleansed_string = this.valueOf();
    var language_codes = new Array(
        'ab',
        'aa',
        'af',
        'sq',
        'am',
        'ar',
        'an',
        'hy',
        'as',
        'ay',
        'az',
        'ba',
        'eu',
        'bn',
        'dz',
        'bh',
        'bi',
        'br',
        'bg',
        'my',
        'be',
        'km',
        'ca',
        'zh',
        'co',
        'hr',
        'cs',
        'da',
        'nl',
        'en',
        'eo',
        'et',
        'fo',
        'fa',
        'fj',
        'fi',
        'fr',
        'fy',
        'gl',
        'gd',
        'gv',
        'ka',
        'de',
        'el',
        'kl',
        'gn',
        'gu',
        'ht',
        'ha',
        'iw',
        'hi',
        'hu',
        'is',
        'io',
        'in',
        'ia',
        'ie',
        'iu',
        'ik',
        'ga',
        'it',
        'ja',
        'jv',
        'kn',
        'ks',
        'kk',
        'rw',
        'ky',
        'rn',
        'ko',
        'ku',
        'lo',
        'la',
        'lv',
        'li',
        'ln',
        'lt',
        'mk',
        'mg',
        'ms',
        'ml',
        'mt',
        'mi',
        'mr',
        'mo',
        'mn',
        'na',
        'ne',
        'no',
        'oc',
        'or',
        'om',
        'ps',
        'pl',
        'pt',
        'pa',
        'qu',
        'rm',
        'ro',
        'ru',
        'sm',
        'sg',
        'sa',
        'sr',
        'sh',
        'st',
        'tn',
        'sn',
        'ii',
        'sd',
        'si',
        'ss',
        'sk',
        'sl',
        'so',
        'es',
        'su',
        'sw',
        'sv',
        'tl',
        'tg',
        'ta',
        'tt',
        'te',
        'th',
        'bo',
        'ti',
        'to',
        'ts',
        'tr',
        'tk',
        'tw',
        'ug',
        'uk',
        'ur',
        'uz',
        'vi',
        'vo',
        'wa',
        'cy',
        'wo',
        'xh',
        'Yi',
        'ji',
        'yo',
        'zu',
    )
         
    // Split out all the individual words in the phrase
    words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g);

    // Review all the words
    for(x=0; x < words.length; x++) {
        // For each word, check all the stop words
        for(y=0; y < language_codes.length; y++) {
            // Get the current word
            word = words[x].replace(/\s+|[^a-z]+/ig, "");   // Trim the word and remove non-alpha
             
            // Get the stop word
            lang_code = language_codes[y];
             
            // If the word matches the stop word, remove it from the keywords
            if(word.toLowerCase() == lang_code) {
                // Build the regex
                regex_str = "^\\s*"+lang_code+"\\s*$";      // Only word
                regex_str += "|^\\s*"+lang_code+"\\s+";     // First word
                regex_str += "|\\s+"+lang_code+"\\s*$";     // Last word
                regex_str += "|\\s+"+lang_code+"\\s+";      // Word somewhere in the middle
                regex = new RegExp(regex_str, "ig");
             
                // Remove the word from the keywords
                cleansed_string = cleansed_string.replace(regex, " ");
            }
        }
    }
    return cleansed_string.replace(/^\s+|\s+$/g, "");
}

String.prototype.normal = function(){
    var cleansed_string = this.valueOf();
    //Merge words with ' to single word i.e. don't => dont
    cleansed_string = cleansed_string.replace(/'(?=[a-z\u00C0-\u017F\p{L}])/g, '');
    //Replace non chars and multiple spaces to single whitespace
    cleansed_string = cleansed_string.replace(/(?![a-zA-Z0-9\u00C0-\u017F\p{L}])\W+/g, ' ');
    return cleansed_string.toLowerCase();

}

String.prototype.removeWords = function(wordsToRemove){
    var x;
    var y;
    var word;
    var remove_word;
    var regex_str;
    var regex;
    var cleansed_string = this.valueOf();
    var remove_words = wordsToRemove;
         
    // Split out all the individual words in the phrase
    var words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g)
    
    // Review all the words
    for(x=0; x < words.length; x++) {
        // For each word, check all the stop words
        for(y=0; y < remove_words.length; y++) {
            // Get the current word
            word = words[x].replace(/\s+|[^a-z]+/ig, "");   // Trim the word and remove non-alpha
             
            // Get the stop word
            remove_word = remove_words[y];
             
            // If the word matches the stop word, remove it from the keywords
            if(word.toLowerCase() == remove_word) {
                // Build the regex
                regex_str = "^\\s*"+remove_word+"\\s*$";      // Only word
                regex_str += "|^\\s*"+remove_word+"\\s+";     // First word
                regex_str += "|\\s+"+remove_word+"\\s*$";     // Last word
                regex_str += "|\\s+"+remove_word+"\\s+";      // Word somewhere in the middle
                regex = new RegExp(regex_str, "ig");
             
                // Remove the word from the keywords
                cleansed_string = cleansed_string.replace(regex, " ");
            }
        }
    }
    return cleansed_string.replace(/^\s+|\s+$/g, "");
}

String.prototype.cleanString = function(){
    var cleansed_string = this.valueOf();

    cleansed_string = cleansed_string.stripTLD();

    return cleansed_string
        //Remove dots from acronyms (ex. U.S.A. to USA) otherwise we 
        //may end up with loose single characters that get discarded from the vocabulary.
        //After that change all to lowercase
        .replace(/(?:\.)(?=[A-Z]\.)|\.(?!\w)/, '').toLowerCase()
        //Remove OTHER unwanted symbols (ignores ',', '.', '-' and '@' when between characters i.e. mail@something.com or 9.000,10 )
        .replace(/((?=\W)\-(?=\W))|((?=[\W\s])@(?=[\W\s]))|((?=\W)\.(?=\W))|((?=\s)\.(?=\s))|((?=[\W\s])\,(?=[\W\s])).|[\\%\$\^\<\>\|\(\)\;\:[~#…"'&_\+\!\?\*\]\/]/g, ' ')

        .replace(/ +(?= )/g, '')
        //Remove single leters/digits i.e. 'a', 'b', '0'
        .replace(/\s[a-z0-9]\s/g, '')
        //.replace(/ +(?= )/g,'').replace(/\s[0-9]\s/g, '')
        .trim();
}

String.prototype.splitWords = function(){
    var cleansed_string = this.valueOf();
    var words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g)
    return words;
}

String.prototype.stripTLD = function(){
    var string = this.valueOf();

    var TLDs = [ '.aero','.arpa','.biz','.cat','.com','.coop','.edu','.gov','.info','.mil','.mobi','.net','.org','.pro','.ac','.ad','.ae','.af','.ag','.ai','.al','.am','.an','.ao','.ap','.aq','.ar','.as','.at','.au','.aw','.az','.ax','.ba','.bb','.bd','.be','.bf','.bg','.bh','.bi','.bj','.bm','.bn','.bo','.br','.bs','.bt','.bv','.bw','.by','.bz','.ca','.cc','.cd','.cf','.cg','.ch','.ci','.ck','.cl','.cm','.cn','.co','.cr','.cs','.cu','.cv','.cx','.cy','.cz','.de','.dj','.dk','.dm','.do','.dz','.ec','.ee','.eg','.eh','.er','.es','.et','.eu','.fi','.fj','.fk','.fm','.fo','.fr','.ga','.gb','.gd','.ge','.gf','.gg','.gh','.gi','.gl','.gm','.gn','.gp','.gq','.gr','.gs','.gt','.gu','.gw','.gy','.hk','.hm','.hn','.hr','.ht','.hu','.id','.ie','.il','.im','.in','.io','.iq','.ir','.is','.it','.je','.jm','.jo','.jp','.ke','.kg','.kh','.ki','.km','.kn','.kp','.kr','.kw','.ky','.kz','.la','.lb','.lc','.li','.lk','.lr','.ls','.lt','.lu','.lv','.ly','.ma','.mc','.md','.mg','.mh','.mk','.ml','.mm','.mn','.mo','.mp','.mq','.mr','.ms','.mt','.mu','.mv','.mw','.mx','.my','.mz','.na','.nc','.ne','.nf','.ng','.ni','.nl','.no','.np','.nr','.nu','.nz','.om','.pa','.pe','.pf','.pg','.ph','.pk','.pl','.pm','.pn','.pr','.ps','.pt','.pw','.py','.qa','.re','.ro','.ru','.rw','.sa','.sb','.sc','.sd','.se','.sg','.sh','.si','.sj','.sk','.sl','.sm','.sn','.so','.sr','.st','.sv','.sy','.sz','.tc','.td','.tf','.tg','.th','.tj','.tk','.tl','.tm','.tn','.to','.tp','.tr','.tt','.tv','.tw','.tz','.ua','.ug','.uk','.um','.us','.uy','.uz','.va','.vc','.ve','.vg','.vi','.vn','.vu','.wf','.ws','.ye','.yt','.yu','.za','.zm','.zw','.org.uk','.org.es','.com.es','.co.uk','.xyz','.me']
    var finalExp = [];
    for(var i=0; i<TLDs.length;i++){ 
        finalExp.push("(?![a-z])(\\"+ TLDs[i] +")\\/?(?![a-z-_.])\\/?");
    };
    //Join expressions with the or symbol (conveniently, won't be placed at the end of string)
    finalExp = finalExp.join('|');

    //Build regex
    var re = new RegExp(finalExp);

    return string.replace(re, ' ').trim() //.replace(/ +(?= )/g, '').trim();
}

String.prototype.cleanDomain = function(){
    var cleansed_string = this.valueOf();
    
    cleansed_string = cleansed_string.stripTLD().toLowerCase();

    cleansed_string = cleansed_string
        //Replace TLDs with whitespaces, remove extra whitespaces and trim
        .replace(/ +(?= )/g,'').replace(/\s[a-z]\s/g, '')
        .replace(/ +(?= )/g,'').replace(/\s[0-9]\s/g, '')
        .split(/\.|-/)
        .join(' ')
        .trim();

    return cleansed_string;
}

String.prototype.cleanProtocol = function(){
    var cleansed_string = this.valueOf();
    return cleansed_string.replace(/https:\/\/|http:\/\/|ftp:\/\/|www\d*\./g, '');
}

String.prototype.cleanURI = function(){
    var cleansed_string = this.valueOf();
    
    //Build regex to remove TLDs
    var TLDs = [ '.aero','.arpa','.biz','.cat','.com','.coop','.edu','.gov','.info','.mil','.mobi','.net','.org','.pro','.ac','.ad','.ae','.af','.ag','.ai','.al','.am','.an','.ao','.ap','.aq','.ar','.as','.at','.au','.aw','.az','.ax','.ba','.bb','.bd','.be','.bf','.bg','.bh','.bi','.bj','.bm','.bn','.bo','.br','.bs','.bt','.bv','.bw','.by','.bz','.ca','.cc','.cd','.cf','.cg','.ch','.ci','.ck','.cl','.cm','.cn','.co','.cr','.cs','.cu','.cv','.cx','.cy','.cz','.de','.dj','.dk','.dm','.do','.dz','.ec','.ee','.eg','.eh','.er','.es','.et','.eu','.fi','.fj','.fk','.fm','.fo','.fr','.ga','.gb','.gd','.ge','.gf','.gg','.gh','.gi','.gl','.gm','.gn','.gp','.gq','.gr','.gs','.gt','.gu','.gw','.gy','.hk','.hm','.hn','.hr','.ht','.hu','.id','.ie','.il','.im','.in','.io','.iq','.ir','.is','.it','.je','.jm','.jo','.jp','.ke','.kg','.kh','.ki','.km','.kn','.kp','.kr','.kw','.ky','.kz','.la','.lb','.lc','.li','.lk','.lr','.ls','.lt','.lu','.lv','.ly','.ma','.mc','.md','.mg','.mh','.mk','.ml','.mm','.mn','.mo','.mp','.mq','.mr','.ms','.mt','.mu','.mv','.mw','.mx','.my','.mz','.na','.nc','.ne','.nf','.ng','.ni','.nl','.no','.np','.nr','.nu','.nz','.om','.pa','.pe','.pf','.pg','.ph','.pk','.pl','.pm','.pn','.pr','.ps','.pt','.pw','.py','.qa','.re','.ro','.ru','.rw','.sa','.sb','.sc','.sd','.se','.sg','.sh','.si','.sj','.sk','.sl','.sm','.sn','.so','.sr','.st','.sv','.sy','.sz','.tc','.td','.tf','.tg','.th','.tj','.tk','.tl','.tm','.tn','.to','.tp','.tr','.tt','.tv','.tw','.tz','.ua','.ug','.uk','.um','.us','.uy','.uz','.va','.vc','.ve','.vg','.vi','.vn','.vu','.wf','.ws','.ye','.yt','.yu','.za','.zm','.zw','.org.uk','.org.es','.com.es','.co.uk','.xyz','.me']
    var finalExp = [];
    for(var i=0; i<TLDs.length;i++){
        finalExp.push("(?![a-zA-Z])"+ TLDs[i] +"\/?(?![a-zA-Z\-_])\/?");
    };
    //Join expressions with the or symbol (conveniently, won't be placed at the end of string)
    finalExp = finalExp.join('|');
    //Build regex
    var re = new RegExp(finalExp);

    //Chain string cleaning

    cleansed_string = cleansed_string
        //First, remove any protocols or Disk names (ex F:\)
        .replace(/https:\/\/|http:\/\/|ftp:\/\/|www\d*\.|[A-Z]]:\\\\|[A-Z]]:\\/g, '')
        //Replace TLDs with whitespaces, remove extra whitespaces and trim
        .replace(re, '\\')
        .replace(/ +(?= )/g, '')
        .replace(/\\\\/g, '\\')
        .trim();

    //Continue splittin of domain elements and/or remaining url string if any
    if(/ .[a-z0-9]/.test(cleansed_string)){
        //Split it in half (domain and remaining url)
        cleansed_string = cleansed_string.split(' ');

        //1) For cleansed_string[0] we're simply splitting by . and -
        //as nothing else should be present in the domain besides these and a-z0-9

        //2) For cleansed_string[1], the first part of the first replace regexp (?!.*\=)[-_](?!\d) makes sure
        //- and _ are not selected if present between digits (like a date 2016-03-04 or 2016_03_04) 
        //or if part of parameters such as my_cool_parameter=1234 (see step 5)

        //3) The second part %\w?. selects URL encoded occurences. 
        //4)Finally, the third part [\[\(~#…,"'&\+\!\?\*\.\)\]\/] selects symbols [(~#…,"'&+!?*.)]\

        //5) At last, we join occurrences of the = symbol. The ideia is to transform parameters and they values into 'unique words'.
        //  The reasons is that many URLs parameters can have names such as 'a', 'e'. As we remove in 6) single words and digits
        //  to avoid polution of the vocabulary and matched projects' bag of words, joining the parameter and its value reduces the
        //  possibility of loosing this data for later statistical analysis. 
        //  Secondly, we avoid having too much duplicates because of repeating parameter names
        //  URL adwords.google.com/cm/CampaignMgmt?authuser=1&__u=123456789&__c=111222333#a.25483450163_616039564.,key_pk&pId=9
        //  Results (spliting on =): adwords google cm CampaignMgmt authuser 1[lost] __u 123456789 __c 111222333 a[lost] 25483450163_616039564 key_pk pId 9[lost]
        //  Results (not spliting on =): adwords google cm CampaignMgmt authuser1 __u123456789 __c111222333 a[lost anyways] 25483450163_616039564 key_pk pId9

        //6) \b[a-z]\b  selects single characters/digits and replaces by '' to avoid returning.
        //We then remove excessive white spaces and do the same for numbers using \b[0-9]\b
        //a, b, c, 0, 5, 2, 7, etc can be found too many times and will only 
        //polute the categorization and analysis when performing Bayes classification of URLS

        cleansed_string = cleansed_string.join(' ')
        .split(/\.|-/).join(' ')
        .replace(/(?!.*\=)[-_](?!\d)|%\w?.|[\[\(~#…,"'&\+\!\?\*\.\)\]\/]/g, ' ')
        .replace(/\=/g, '');
        
        cleansed_string = cleansed_string.replace(/ +(?= )/g,'')
                            .replace(/\b[a-z]\b/, '')
                            .replace(/ +(?= )/g,'');
                            //.replace(/\b[0-9]\b/, '');
    }   
    else{
        //Try to split for sub domains and/or hifens
        cleansed_string = cleansed_string.split(/\.|-/).join(' ');
    }

    //Final cleanup, remove any extra whitespaces and trim trailing/leading whitespace
    cleansed_string = cleansed_string.replace(/ +(?= )/g,'').trim();
    
    return cleansed_string;
}