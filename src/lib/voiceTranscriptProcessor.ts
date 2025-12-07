/**
 * Processes voice transcript to make it suitable for form inputs
 */

/**
 * Converts spoken Spanish words to special characters commonly used in emails
 */
export function processEmailTranscript(transcript: string): string {
    let processed = transcript;

    // Convert spoken words to special characters
    const replacements: Record<string, string> = {
        // @ symbol
        'arroba': '@',
        'aroba': '@',
        'a roba': '@',

        // Dot/period
        'punto': '.',
        'punto com': '.com',
        'punto es': '.es',
        'punto org': '.org',
        'punto net': '.net',

        // Hyphen/dash
        'guión': '-',
        'guion': '-',
        'guión bajo': '_',
        'guion bajo': '_',
        'underscore': '_',

        // Numbers (in case they're spoken as words)
        'cero': '0',
        'uno': '1',
        'dos': '2',
        'tres': '3',
        'cuatro': '4',
        'cinco': '5',
        'seis': '6',
        'siete': '7',
        'ocho': '8',
        'nueve': '9',
    };

    // Apply replacements (case-insensitive)
    Object.entries(replacements).forEach(([word, char]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        processed = processed.replace(regex, char);
    });

    // Remove stress marks (tildes) - common in Spanish
    processed = processed
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/Á/g, 'a')
        .replace(/É/g, 'e')
        .replace(/Í/g, 'i')
        .replace(/Ó/g, 'o')
        .replace(/Ú/g, 'u')
        .replace(/Ñ/g, 'n');

    // Convert to lowercase
    processed = processed.toLowerCase();

    // Remove extra spaces
    processed = processed.replace(/\s+/g, '');

    return processed;
}

/**
 * Processes transcript for password fields
 * Removes stress marks and extra spaces but preserves case and special characters
 */
export function processPasswordTranscript(transcript: string): string {
    let processed = transcript;

    // Remove stress marks (tildes)
    processed = processed
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/Á/g, 'A')
        .replace(/É/g, 'E')
        .replace(/Í/g, 'I')
        .replace(/Ó/g, 'O')
        .replace(/Ú/g, 'U')
        .replace(/Ñ/g, 'N');

    // Remove spaces (passwords typically don't have spaces)
    processed = processed.replace(/\s+/g, '');

    return processed;
}

/**
 * Processes transcript for name fields
 * Capitalizes first letter of each word and removes stress marks
 */
export function processNameTranscript(transcript: string): string {
    let processed = transcript;

    // Remove stress marks (tildes)
    processed = processed
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/Á/g, 'A')
        .replace(/É/g, 'E')
        .replace(/Í/g, 'I')
        .replace(/Ó/g, 'O')
        .replace(/Ú/g, 'U')
        .replace(/Ñ/g, 'N');

    // Capitalize first letter of each word
    processed = processed
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return processed.trim();
}
