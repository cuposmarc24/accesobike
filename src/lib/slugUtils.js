// Utilidad para generar slugs únicos a partir de nombres de eventos
export const generateSlug = (eventName) => {
    return eventName
        .toLowerCase()
        .normalize('NFD') // Normalizar caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
        .trim()
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/-+/g, '-'); // Eliminar guiones duplicados
};

// Verificar si un slug ya existe en Supabase
export const checkSlugExists = async (supabase, slug) => {
    const { data, error } = await supabase
        .from('events')
        .select('event_slug')
        .eq('event_slug', slug)
        .single();

    return !error && data !== null;
};

// Generar slug único (agregar número si ya existe)
export const generateUniqueSlug = async (supabase, eventName) => {
    let slug = generateSlug(eventName);
    let counter = 1;
    let finalSlug = slug;

    while (await checkSlugExists(supabase, finalSlug)) {
        finalSlug = `${slug}-${counter}`;
        counter++;
    }

    return finalSlug;
};

// Ejemplo de uso:
// const slug = await generateUniqueSlug(supabase, "13 Aniversario GirosGym");
// Resultado: "13-aniversario-girosgym"
// Si ya existe: "13-aniversario-girosgym-2"
